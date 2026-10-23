import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { expireReservations } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { env } from "@/lib/env";

/**
 * Защищенное от атак по времени (Timing Attack) сравнение секретных токенов.
 */
function verifySecretTimingSafe(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedHash = crypto.createHash("sha256").update(provided).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

/**
 * Проверка авторизации cron-запроса.
 * Поддерживает:
 * 1. Заголовок `Authorization: Bearer <CRON_SECRET>` (рекомендуется)
 * 2. Заголовок `x-cron-secret: <CRON_SECRET>`
 * 3. Query-параметр `?secret=<CRON_SECRET>` (для быстрой ручной проверки)
 */
function authorizeCronRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const providedSecret =
    (authHeader?.startsWith("Bearer ") || authHeader?.startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null) ||
    customHeader ||
    querySecret;

  if (!providedSecret) {
    return false;
  }

  return verifySecretTimingSafe(providedSecret, env.CRON_SECRET);
}

async function handleExpireReservations() {
  const startTime = Date.now();

  try {
    const expiredList = await expireReservations();

    if (expiredList.length > 0) {
      // 1. Инвалидация глобального тега каталога
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
      } catch {
        // Игнорируем вне Next.js запроса
      }

      // 2. Инвалидация конкретных кукол и путей витрины
      for (const item of expiredList) {
        try {
          revalidateTag(CACHE_TAGS.product(item.slug), { expire: 0 });
          revalidatePath(`/kukly/${item.slug}`, "page");
        } catch {
          // Игнорируем
        }
      }

      // 3. Инвалидация списков
      try {
        revalidatePath("/", "page");
        revalidatePath("/kukly", "page");
        revalidatePath("/cart", "page");
        revalidatePath("/admin/kukly", "page");
      } catch {
        // Игнорируем
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        expiredCount: expiredList.length,
        expired: expiredList,
        durationMs,
        message:
          expiredList.length > 0
            ? `Успешно освобождено истёкших броней: ${expiredList.length}`
            : "Активных истёкших броней не обнаружено",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Ошибка при выполнении cron-задачи expire-reservations:", err);
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: "Не удалось выполнить процедуру освобождения броней",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authorizeCronRequest(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "Доступ запрещен: некорректный или отсутствующий CRON_SECRET",
      },
      { status: 401 }
    );
  }

  return handleExpireReservations();
}

export async function GET(req: NextRequest) {
  if (!authorizeCronRequest(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "Доступ запрещен: некорректный или отсутствующий CRON_SECRET",
      },
      { status: 401 }
    );
  }

  return handleExpireReservations();
}
