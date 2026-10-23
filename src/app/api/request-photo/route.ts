import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { saveUploadedFileLocally } from "@/lib/storage/local-fs";
import { getAdminSession } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const REQUEST_PHOTO_PREFIX = "/uploads/requests/";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // до 10 МБ для современных смартфонов

function jsonResponse(data: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

/** Определяет тип изображения по сигнатуре файла (magic numbers), а не по заявленному клиентом MIME. */
function detectImageExt(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  // PNG
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  // WebP
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  return null;
}

/**
 * Загрузка фото-референсов (до 10 файлов, до 10 МБ, JPEG/PNG/WebP).
 * Доступна как клиентам при оформлении заявки, так и мастеру из панели управления.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession().catch(() => null);

  // Для не-админов проверяем rate limit
  if (!session) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rate = checkRateLimit(`request_photo:${ip}`, 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return jsonResponse(
        { error: "Слишком много загрузок. Попробуйте через несколько минут." },
        429
      );
    }
  }

  let files: File[];
  try {
    const form = await request.formData();
    files = form.getAll("files").filter((f): f is File => f instanceof File);
  } catch {
    return jsonResponse({ error: "Не удалось прочитать файлы." }, 400);
  }

  if (files.length === 0) {
    return jsonResponse({ error: "Выберите хотя бы одно фото." }, 400);
  }
  if (files.length > MAX_FILES) {
    return jsonResponse({ error: `Можно загрузить не более ${MAX_FILES} фото.` }, 400);
  }

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: "Каждое фото должно быть не больше 10 МБ." }, 400);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(buf);
    if (!ext) {
      return jsonResponse(
        { error: "Допустимы только изображения JPEG, PNG или WebP." },
        400
      );
    }
    const name = `${crypto.randomUUID()}${ext}`;
    await saveUploadedFileLocally(`requests/${name}`, buf);
    urls.push(`${REQUEST_PHOTO_PREFIX}${name}`);
  }

  return jsonResponse({ urls });
}
