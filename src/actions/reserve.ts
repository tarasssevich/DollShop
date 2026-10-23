"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { reservations, products, productMedia } from "@/db/schema";
import { reserveProduct, releaseReservation } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  RESERVATION_TTL_MINUTES,
  RESERVATION_TTL_SECONDS,
  RESERVATION_COOKIE_PREFIX,
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

      // Мгновенно инвалидируем кэш каталога, чтобы витрина и админка отразили статус «В брони»
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
        revalidateTag(CACHE_TAGS.product(slug), { expire: 0 });
        revalidatePath("/", "page");
        revalidatePath("/kukly", "page");
        revalidatePath(`/kukly/${slug}`, "page");
        revalidatePath("/cart", "page");
        revalidatePath("/admin/kukly", "page");
        revalidatePath("/admin/zakazy", "page");
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
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(slug), { expire: 0 });
      revalidatePath("/", "page");
      revalidatePath("/kukly", "page");
      revalidatePath(`/kukly/${slug}`, "page");
      revalidatePath("/cart", "page");
      revalidatePath("/admin/kukly", "page");
      revalidatePath("/admin/zakazy", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    if (!released) {
      // Бронь могли уже снять (мастер из админки, истечение таймера, другая вкладка) —
      // если кукла уже свободна, цель достигнута, ошибкой это считать не нужно.
      const [current] = await db
        .select({ status: products.status })
        .from(products)
        .where(eq(products.id, productId));
      if (current?.status === "available") {
        return { success: true };
      }
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

export type ActiveUserReservationResult =
  | {
      hasReservation: true;
      productId: string;
      slug: string;
      dollName: string;
      priceByn: number;
      coverImageUrl: string;
      category: string;
      heightCm: number;
      expiresAt: string;
      secondsRemaining: number;
    }
  | {
      hasReservation: false;
    };

export type ActiveReservationItem = Extract<
  ActiveUserReservationResult,
  { hasReservation: true }
>;

/**
 * Получение ВСЕХ активных броней пользователя по cookie сессии (корзина из нескольких кукол).
 * Отсортированы по времени истечения (раньше истекающие — выше).
 */
export async function getActiveReservationsAction(): Promise<ActiveReservationItem[]> {
  const cookieStore = await cookies();
  const resCookies = cookieStore
    .getAll()
    .filter((c) => c.name.startsWith(RESERVATION_COOKIE_PREFIX));

  const items: ActiveReservationItem[] = [];

  for (const c of resCookies) {
    const productId = c.name.slice(RESERVATION_COOKIE_PREFIX.length);
    const rawToken = c.value;
    if (!rawToken || rawToken.trim().length < 16) continue;

    const tokenHash = hashReservationToken(rawToken);

    try {
      const [active] = await db
        .select({
          productId: reservations.productId,
          expiresAt: reservations.expiresAt,
          slug: products.slug,
          title: products.title,
          price: products.price,
          specs: products.specs,
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

      if (!active) continue;

      const secondsRemaining = Math.max(
        0,
        Math.floor((active.expiresAt.getTime() - Date.now()) / 1000)
      );

      const [coverMedia] = await db
        .select({ url: productMedia.url })
        .from(productMedia)
        .where(eq(productMedia.productId, active.productId))
        .orderBy(productMedia.displayOrder)
        .limit(1);

      const specs = active.specs as {
        category?: string;
        height_cm?: number;
      } | null;

      items.push({
        hasReservation: true,
        productId: active.productId,
        slug: active.slug,
        dollName: active.title,
        priceByn: Number(active.price),
        coverImageUrl: coverMedia?.url || "/mock/dolls/fairy-blue-1.jpg",
        category: specs?.category || "Цветочные феи",
        heightCm: specs?.height_cm || 21,
        expiresAt: active.expiresAt.toISOString(),
        secondsRemaining,
      });
    } catch (err) {
      console.error("Ошибка при поиске активной брони в сессии:", err);
    }
  }

  return items.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
}

/**
 * Первая (ближайшая к истечению) активная бронь пользователя.
 * Оставлена для обратной совместимости — для корзины используйте `getActiveReservationsAction`.
 */
export async function getActiveReservationAction(): Promise<ActiveUserReservationResult> {
  const [first] = await getActiveReservationsAction();
  return first ?? { hasReservation: false };
}
