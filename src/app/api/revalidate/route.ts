import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { isValidCacheTag } from "@/lib/cache/tags";

const tagSchema = z
  .string()
  .min(1)
  .max(130)
  .refine(isValidCacheTag, {
    message:
      "Недопустимый тег кэша (разрешены: products, settings, gallery, product:{slug})",
  });

const pathSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^\/[a-zA-Z0-9/_-]*$/, "Путь должен начинаться с / и содержать допустимые символы URL");

const revalidateBodySchema = z.object({
  tags: z.array(tagSchema).max(50).optional(),
  paths: z.array(pathSchema).max(50).optional(),
  tag: tagSchema.optional(),
  path: pathSchema.optional(),
});

/**
 * Защищенное от атак по времени (Timing Attack) сравнение секретных токенов.
 * Хэширует оба значения через SHA-256 перед timingSafeEqual, чтобы скрыть даже длину секрета.
 */
function verifySecretTimingSafe(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedHash = crypto.createHash("sha256").update(provided).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

/**
 * Эндпоинт ручной и автоматической инвалидации ISR-кэша витрины по секрету.
 * Принимает секрет ТОЛЬКО в HTTP-заголовках (Authorization: Bearer или x-revalidate-secret),
 * исключая утечку секрета в access-логи веб-сервера через URL query string.
 */
export async function POST(req: NextRequest) {
  // 1. Проверка авторизации через заголовки с защитой от Timing Attack
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-revalidate-secret");

  const providedSecret =
    (authHeader?.startsWith("Bearer ") || authHeader?.startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null) || customHeader;

  if (
    !providedSecret ||
    !verifySecretTimingSafe(providedSecret, env.REVALIDATE_SECRET)
  ) {
    return NextResponse.json(
      { error: "Неверный секретный ключ авторизации" },
      { status: 401 }
    );
  }

  // 2. Валидация тела запроса
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Ожидается валидный JSON в теле запроса" },
      { status: 400 }
    );
  }

  const parsed = revalidateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Неверный формат тела запроса",
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const tagsToRevalidate = new Set<string>();
  const pathsToRevalidate = new Set<string>();

  if (parsed.data.tags) {
    for (const t of parsed.data.tags) tagsToRevalidate.add(t);
  }
  if (parsed.data.tag) {
    tagsToRevalidate.add(parsed.data.tag);
  }

  if (parsed.data.paths) {
    for (const p of parsed.data.paths) pathsToRevalidate.add(p);
  }
  if (parsed.data.path) {
    pathsToRevalidate.add(parsed.data.path);
  }

  if (tagsToRevalidate.size === 0 && pathsToRevalidate.size === 0) {
    return NextResponse.json(
      { error: "Не указаны теги (tags) или пути (paths) для инвалидации" },
      { status: 400 }
    );
  }

  // 3. Вызов инвалидации Next.js кэша
  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, "max-age=0");
  }

  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tags: Array.from(tagsToRevalidate),
    paths: Array.from(pathsToRevalidate),
    timestamp: new Date().toISOString(),
  });
}
