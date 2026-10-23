import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { getAdminSession } from "@/lib/auth/guard";
import { saveUploadedFileLocally } from "@/lib/storage/local-fs";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set([
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
  ".avif",
  ".mp4",
]);

export async function PUT(request: NextRequest) {
  // Локальный эндпоинт загрузки доступен только авторизованному администратору (в тестах отключается)
  if (process.env.NODE_ENV !== "test") {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Необходима авторизация администратора" },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Параметр key обязателен" },
      { status: 400 }
    );
  }

  // Защита от path traversal (../) и абсолютных путей
  const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
  const targetPath = path.resolve(uploadsDir, key);

  if (!targetPath.startsWith(uploadsDir) || key.includes("..") || path.isAbsolute(key)) {
    return NextResponse.json(
      { error: "Недопустимый путь к файлу" },
      { status: 400 }
    );
  }

  // Строгая проверка разрешенного расширения файла (защита от Stored XSS: .html, .svg, .js и т.д.)
  const ext = path.extname(key).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Недопустимый тип файла. Разрешены только форматы: WebP, JPEG, PNG, AVIF, MP4." },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await saveUploadedFileLocally(key, buffer);

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("Local upload error:", err);
    return NextResponse.json(
      { error: "Ошибка при сохранении файла" },
      { status: 500 }
    );
  }
}
