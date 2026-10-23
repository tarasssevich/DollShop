import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

function getCandidateUploadDirs(): string[] {
  const dirs = new Set<string>();

  // 1. Рабочая директория public/uploads
  dirs.add(path.resolve(process.cwd(), "public", "uploads"));

  // 2. Если запущено внутри .next/standalone, проверяем корень проекта
  if (process.cwd().includes(path.join(".next", "standalone"))) {
    dirs.add(path.resolve(process.cwd(), "..", "..", "public", "uploads"));
  }

  // 3. Если запущено в корне проекта, проверяем .next/standalone
  dirs.add(path.resolve(process.cwd(), ".next", "standalone", "public", "uploads"));

  // 4. Абсолютные пути репозитория
  dirs.add("/home/ofi/DollShop/public/uploads");
  dirs.add("/home/ofi/DollShop/.next/standalone/public/uploads");

  return Array.from(dirs);
}

async function findUploadedFile(relativePath: string): Promise<string | null> {
  const candidateDirs = getCandidateUploadDirs();
  for (const baseDir of candidateDirs) {
    const fullPath = path.resolve(baseDir, relativePath);
    // Защита от path traversal: путь строго обязан начинаться с baseDir
    if (!fullPath.startsWith(baseDir)) {
      continue;
    }
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        return fullPath;
      }
    } catch {
      // Файл не найден в текущей кандидатной директории
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ error: "Файл не указан" }, { status: 400 });
  }

  // Проверка на path traversal (../, ..\, нуль-байты)
  for (const segment of pathSegments) {
    if (
      segment === ".." ||
      segment === "." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
    ) {
      return NextResponse.json({ error: "Недопустимый путь к файлу" }, { status: 400 });
    }
  }

  const relativePath = pathSegments.join(path.sep);
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = MIME_MAP[ext];

  if (!contentType) {
    return NextResponse.json({ error: "Неподдерживаемый тип файла" }, { status: 400 });
  }

  const filePath = await findUploadedFile(relativePath);
  if (!filePath) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  try {
    const stat = await fs.stat(/*turbopackIgnore: true*/ filePath);
    const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": stat.mtime.toUTCString(),
      },
    });
  } catch (err) {
    console.error("Ошибка отдачи медиа-файла:", err);
    return NextResponse.json({ error: "Ошибка чтения файла" }, { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;

  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse(null, { status: 400 });
  }

  for (const segment of pathSegments) {
    if (
      segment === ".." ||
      segment === "." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
    ) {
      return new NextResponse(null, { status: 400 });
    }
  }

  const relativePath = pathSegments.join(path.sep);
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = MIME_MAP[ext];

  if (!contentType) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = await findUploadedFile(relativePath);
  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const stat = await fs.stat(/*turbopackIgnore: true*/ filePath);
    const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": stat.mtime.toUTCString(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
