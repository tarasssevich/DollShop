"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { reservations, products } from "@/db/schema";
import { reserveProduct, releaseReservation } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  RESERVATION_TTL_MINUTES,
  RESERVATION_TTL_SECONDS,
  getReservationCookieName,
  hashReservationToken,
  type ReserveActionResult,
  type ReleaseActionResult,
  type ReservationStatusResult,
} from "@/lib/reservation/token";

const reserveInputSchema = z.object({
  productId: z.string().uuid("Некорректный идентификатор товара"),
  slug: z.string().min(1, "Слаг куклы обязателен"),
});

const releaseInputSchema = z.object({
  productId: z.string().uuid("Некорректный идентификатор товара"),
  slug: z.string().min(1, "Слаг куклы обязателен"),
});

/**
 * Атомарная бронь куклы на 15 минут (Step 5.1).
 * Вызывает PostgreSQL хранимую процедуру `reserve_product` с блокировкой строки FOR UPDATE,
 * сохраняет защищенный токен в httpOnly cookie и инвалидирует ISR кэш каталога.
 */
export async function reserveProductAction(
  input: z.infer<typeof reserveInputSchema>
): Promise<ReserveActionResult> {
  const parsed = reserveInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { productId, slug } = parsed.data;

  // Защита от массового выкупа ботами (Inventory DoS): максимум 15 запросов за 5 минут с одного IP
  let clientIp = "127.0.0.1";
  try {
    const reqHeaders = await headers();
    clientIp =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      reqHeaders.get("x-real-ip") ||
      "127.0.0.1";
  } catch {
    // В тестах
  }

  const rateCheck = checkRateLimit(`reserve:${clientIp}`, 15, 5 * 60 * 1000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error: "Слишком много попыток бронирования подряд. Пожалуйста, подождите несколько минут перед следующей попыткой.",
    };
  }

  const cookieStore = await cookies();
  const cookieName = getReservationCookieName(productId);

  // Если у покупателя уже есть сохраненный токен — используем его для идемпотентного продления/подтверждения
  let rawToken = cookieStore.get(cookieName)?.value;
  if (!rawToken || rawToken.trim().length < 16) {
    rawToken = crypto.randomBytes(32).toString("hex");
  }

  const tokenHash = hashReservationToken(rawToken);

  try {
    const res = await reserveProduct(productId, tokenHash, RESERVATION_TTL_MINUTES);

    if (res.status === "SUCCESS") {
      const expiresAt =
        res.reservedUntil ??
        new Date(Date.now() + RESERVATION_TTL_SECONDS * 1000);

      // Сохраняем сырой токен в httpOnly cookie
      cookieStore.set(cookieName, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: RESERVATION_TTL_SECONDS,
      });

      // Мгновенно инвалидируем кэш каталога, чтобы витрина отразила статус «В брони»
      try {
        revalidateTag(CACHE_TAGS.products, "max-age=0");
        revalidateTag(CACHE_TAGS.product(slug), "max-age=0");
      } catch {
        // Игнорируем вне контекста Next.js запроса (например, в vitest тестах)
      }

      return {
        success: true,
        redirectUrl: `/oformlenie/${slug}`,
        reservedUntil: expiresAt.toISOString(),
      };
    }

    // Обработка отказов из PostgreSQL
    switch (res.errorCode) {
      case "ALREADY_RESERVED":
        return {
          success: false,
          code: "ALREADY_RESERVED",
          error:
            "Эту куклу только что забронировали. Но бронь действует 15 минут — вы можете оставить контакт, и мы сразу сообщим, если она освободится.",
        };
      case "SOLD":
        return {
          success: false,
          code: "SOLD",
          error:
            "Эта кукла уже обрела свой дом и находится в частной коллекции. Вы можете заказать похожую по индивидуальным пожеланиям.",
        };
      case "NOT_FOUND":
        return {
          success: false,
          code: "NOT_FOUND",
          error: "Кукла не найдена в каталоге магазина.",
        };
      default:
        return {
          success: false,
          code: "UNAVAILABLE",
          error:
            "Кукла сейчас недоступна для бронирования. Пожалуйста, обновите страницу каталога.",
        };
    }
  } catch (err) {
    console.error("Ошибка при бронировании куклы:", err);
    return {
      success: false,
      code: "UNAVAILABLE",
      error: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.",
    };
  }
}

/**
 * Добровольное освобождение брони покупателем.
 * Снимает бронь в БД через функцию `release_reservation`, удаляет cookie и возвращает куклу на витрину.
 */
export async function releaseReservationAction(
  input: z.infer<typeof releaseInputSchema>
): Promise<ReleaseActionResult> {
  const parsed = releaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { productId, slug } = parsed.data;
  const cookieStore = await cookies();
  const cookieName = getReservationCookieName(productId);
  const rawToken = cookieStore.get(cookieName)?.value;

  if (!rawToken) {
    return {
      success: false,
      error: "Активная бронь на данную куклу не найдена в вашей сессии.",
    };
  }

  const tokenHash = hashReservationToken(rawToken);

  try {
    const released = await releaseReservation(productId, tokenHash);

    // Удаляем cookie брони в любом случае
    cookieStore.delete(cookieName);

    try {
      revalidateTag(CACHE_TAGS.products, "max-age=0");
      revalidateTag(CACHE_TAGS.product(slug), "max-age=0");
    } catch {
      // Игнорируем вне Next.js
    }

    if (!released) {
      return {
        success: false,
        error:
          "Не удалось освободить бронь (возможно, время уже истекло или заказ уже оформлен).",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка при освобождении брони:", err);
    return {
      success: false,
      error: "Произошла ошибка при отмене брони.",
    };
  }
}

/**
 * Проверка актуальности брони текущего пользователя по cookie и записям в БД.
 */
export async function checkReservationStatusAction(
  productId: string
): Promise<ReservationStatusResult> {
  const cookieStore = await cookies();
  const cookieName = getReservationCookieName(productId);
  const rawToken = cookieStore.get(cookieName)?.value;

  if (!rawToken) {
    return { hasReservation: false, reason: "NO_COOKIE" };
  }

  const tokenHash = hashReservationToken(rawToken);

  try {
    const [active] = await db
      .select({
        expiresAt: reservations.expiresAt,
        productStatus: products.status,
      })
      .from(reservations)
      .innerJoin(products, eq(products.id, reservations.productId))
      .where(
        and(
          eq(reservations.productId, productId),
          eq(reservations.tokenHash, tokenHash),
          gt(reservations.expiresAt, new Date())
        )
      );

    if (!active) {
      return { hasReservation: false, reason: "EXPIRED" };
    }

    const now = Date.now();
    const expiresMs = active.expiresAt.getTime();
    const secondsRemaining = Math.max(0, Math.floor((expiresMs - now) / 1000));

    return {
      hasReservation: true,
      expiresAt: active.expiresAt.toISOString(),
      secondsRemaining,
    };
  } catch (err) {
    console.error("Ошибка при проверке статуса брони:", err);
    return { hasReservation: false, reason: "NOT_FOUND" };
  }
}
