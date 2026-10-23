import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { findUploadedFileLocally } from "@/lib/storage/local-fs";

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

function jsonError(message: string, status: number): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;

  if (!pathSegments || pathSegments.length === 0) {
    return jsonError("Файл не указан", 400);
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
      return jsonError("Недопустимый путь к файлу", 400);
    }
  }

  const relativePath = pathSegments.join(path.sep);
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = MIME_MAP[ext];

  if (!contentType) {
    return jsonError("Неподдерживаемый тип файла", 400);
  }

  const filePath = await findUploadedFileLocally(relativePath);
  if (!filePath) {
    return jsonError("Файл не найден", 404);
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

  const filePath = await findUploadedFileLocally(relativePath);
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
