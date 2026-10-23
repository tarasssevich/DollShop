import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";

const revalidateBodySchema = z.object({
  tags: z.array(z.string().min(1)).optional(),
  paths: z.array(z.string().min(1)).optional(),
  tag: z.string().optional(),
  path: z.string().optional(),
});

/**
 * Эндпоинт ручной и автоматической инвалидации ISR-кэша витрины по секрету.
 * Принимает теги (например, 'products', 'product:selesta', 'settings') или пути ('/kukly').
 */
export async function POST(req: NextRequest) {
  // 1. Проверка авторизации через секретный токен
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-revalidate-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") || customHeader || querySecret;

  if (!providedSecret || providedSecret !== env.REVALIDATE_SECRET) {
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
    // Если тело пустое, но указан тег в query, разрешаем
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

  const tagsToRevalidate: string[] = [];
  const pathsToRevalidate: string[] = [];

  if (parsed.data.tags) tagsToRevalidate.push(...parsed.data.tags);
  if (parsed.data.tag) tagsToRevalidate.push(parsed.data.tag);

  const queryTag = req.nextUrl.searchParams.get("tag");
  if (queryTag) tagsToRevalidate.push(queryTag);

  if (parsed.data.paths) pathsToRevalidate.push(...parsed.data.paths);
  if (parsed.data.path) pathsToRevalidate.push(parsed.data.path);

  const queryPath = req.nextUrl.searchParams.get("path");
  if (queryPath) pathsToRevalidate.push(queryPath);

  if (tagsToRevalidate.length === 0 && pathsToRevalidate.length === 0) {
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
    tags: tagsToRevalidate,
    paths: pathsToRevalidate,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const querySecret = req.nextUrl.searchParams.get("secret");
  const queryTag = req.nextUrl.searchParams.get("tag");
  const queryPath = req.nextUrl.searchParams.get("path");

  if (!querySecret || querySecret !== env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "Неверный секретный ключ авторизации" },
      { status: 401 }
    );
  }

  if (!queryTag && !queryPath) {
    return NextResponse.json(
      { error: "Укажите параметр ?tag=... или ?path=..." },
      { status: 400 }
    );
  }

  if (queryTag) {
    revalidateTag(queryTag, "max-age=0");
  }
  if (queryPath) {
    revalidatePath(queryPath);
  }

  return NextResponse.json({
    revalidated: true,
    tag: queryTag || null,
    path: queryPath || null,
    timestamp: new Date().toISOString(),
  });
}
