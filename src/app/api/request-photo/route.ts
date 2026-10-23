import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const REQUEST_PHOTO_PREFIX = "/uploads/requests/";
const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Определяет тип изображения по сигнатуре файла (а не по заявленному клиентом MIME). */
function detectImageExt(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  return null;
}

/**
 * Публичная загрузка фото-референсов для заявки «Хочу похожую» (до 3 файлов, до 5 МБ, JPEG/PNG/WebP).
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rate = checkRateLimit(`request_photo:${ip}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Слишком много загрузок. Попробуйте через несколько минут." },
      { status: 429 }
    );
  }

  let files: File[];
  try {
    const form = await request.formData();
    files = form.getAll("files").filter((f): f is File => f instanceof File);
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файлы." }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "Выберите хотя бы одно фото." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Можно загрузить не более ${MAX_FILES} фото.` }, { status: 400 });
  }

  const dir = path.resolve(process.cwd(), "public", "uploads", "requests");
  await fs.mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Каждое фото должно быть не больше 5 МБ." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(buf);
    if (!ext) {
      return NextResponse.json(
        { error: "Допустимы только изображения JPEG, PNG или WebP." },
        { status: 400 }
      );
    }
    const name = `${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(dir, name), buf);
    urls.push(`${REQUEST_PHOTO_PREFIX}${name}`);
  }

  return NextResponse.json({ urls });
}
