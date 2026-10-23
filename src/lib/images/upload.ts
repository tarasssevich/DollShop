import {
  createUploadUrlsAction,
  saveProductMediaAction,
} from "@/actions/admin/media";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/schemas/admin-media";
import { processDollImage } from "./compress";
import type { productMedia } from "@/db/schema";

export type ProductMediaItem = typeof productMedia.$inferSelect;

export type UploadStage =
  | "validating"
  | "compressing"
  | "requesting_urls"
  | "uploading"
  | "saving"
  | "completed"
  | "error";

export interface UploadProgressEvent {
  stage: UploadStage;
  percent: number; // 0 - 100
  message: string;
}

export interface UploadDollImageOptions {
  file: File;
  productId: string;
  alt?: string;
  displayOrder?: number;
  onProgress?: (event: UploadProgressEvent) => void;
  maxRetries?: number;
}

export class HttpUploadError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpUploadError";
  }
}

/**
 * Выполняет PUT-запрос с автоматическими повторами при сетевых сбоях.
 */
export async function uploadWithRetry(
  url: string,
  blob: Blob,
  headers: Record<string, string> = {},
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/webp",
          ...headers,
        },
        body: blob,
      });

      if (response.ok) {
        return response;
      }

      // Если статус ответа 4xx, повторять нет смысла — выбрасываем сразу
      if (response.status >= 400 && response.status < 500) {
        throw new HttpUploadError(
          response.status,
          `Ошибка загрузки: статус ${response.status}`
        );
      }

      throw new Error(`Сервер вернул статус ${response.status}`);
    } catch (err) {
      if (err instanceof HttpUploadError) {
        throw err;
      }
      lastError = err;
      attempt++;
      if (attempt < maxRetries) {
        // Экспоненциальная пауза перед повтором
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Не удалось загрузить файл после повторных попыток");
}

/**
 * Определяет MIME-тип файла, используя заявленный браузером тип или расширение файла.
 * На мобильных устройствах (iOS/Android) при выборе из галереи file.type иногда приходит пустым.
 */
export function resolveImageMimeType(file: { name: string; type?: string }): string {
  if (file.type && file.type.startsWith("image/")) {
    return file.type.toLowerCase();
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return file.type?.toLowerCase() || "";
  }
}

/**
 * Главный координатор загрузки фотографии куклы:
 * 1. Валидация файла на клиенте
 * 2. Сжатие в 3 WebP (2000, 1280, 640px) + micro-blur
 * 3. Получение presigned URL
 * 4. Прямая параллельная загрузка в S3 / локальный эмулятор
 * 5. Сохранение метаданных в базу данных
 */
export async function uploadDollImage(
  options: UploadDollImageOptions
): Promise<ProductMediaItem> {
  const {
    file,
    productId,
    alt,
    displayOrder,
    onProgress,
    maxRetries = 3,
  } = options;

  const report = (stage: UploadStage, percent: number, message: string) => {
    onProgress?.({ stage, percent, message });
  };

  // 1. Валидация
  report("validating", 5, "Проверка файла...");
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Файл "${file.name}" слишком большой (максимум ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} МБ)`
    );
  }

  const mime = resolveImageMimeType(file) as (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
    throw new Error(
      "Неподдерживаемый формат. Пожалуйста, используйте JPEG, PNG, WebP или HEIC"
    );
  }

  // 2. Сжатие
  report("compressing", 15, "Оптимизация и сжатие...");
  const processed = await processDollImage(file);

  const isJpeg =
    processed.variants["2000"].blob.type === "image/jpeg" ||
    processed.format === "jpeg";
  const contentType = isJpeg ? "image/jpeg" : "image/webp";
  const ext = isJpeg ? "jpg" : "webp";

  // 3. Запрос presigned URLs
  report("requesting_urls", 40, "Получение ссылок для загрузки...");
  const urlsResponse = await createUploadUrlsAction({
    productId,
    files: [
      {
        filename: file.name.replace(/\.[^/.]+$/, `.${ext}`),
        contentType,
        size: processed.variants["2000"].size,
      },
    ],
  });

  if (!urlsResponse.success) {
    throw new Error(
      urlsResponse.error || "Не удалось получить ссылки для загрузки"
    );
  }

  const uploadItem = urlsResponse.items[0];
  if (!uploadItem) {
    throw new Error("Не удалось получить ссылки для загрузки");
  }

  // 4. Параллельная загрузка 3-х вариантов в S3
  report("uploading", 50, "Загрузка фото в хранилище...");

  const uploadTasks = (["2000", "1280", "640"] as const).map(
    async (sizeKey) => {
      const variantMeta = uploadItem.variants[sizeKey];
      const compressedVariant = processed.variants[sizeKey];

      return uploadWithRetry(
        variantMeta.uploadUrl,
        compressedVariant.blob,
        {
          "Content-Type": contentType,
          ...variantMeta.headers,
        },
        maxRetries
      );
    }
  );

  await Promise.all(uploadTasks);

  // 5. Сохранение в БД
  report("saving", 85, "Сохранение в каталоге...");
  const highResMeta = uploadItem.variants["2000"];

  const saveResponse = await saveProductMediaAction({
    productId,
    mediaId: uploadItem.mediaId,
    url: highResMeta.publicUrl,
    storageKey: highResMeta.key,
    blurDataUrl: processed.blurDataUrl,
    width: processed.originalWidth,
    height: processed.originalHeight,
    alt: alt || file.name.replace(/\.[^/.]+$/, ""),
    displayOrder,
  });

  if (!saveResponse.success) {
    throw new Error(saveResponse.error);
  }

  report("completed", 100, "Фотография успешно добавлена!");
  return saveResponse.media;
}
