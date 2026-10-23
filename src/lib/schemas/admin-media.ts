import { z } from "zod";

// Разрешенные MIME-типы фотографий
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

// Максимальный размер загружаемого исходного файла (15 МБ)
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

export const createUploadUrlsSchema = z.object({
  productId: z.string().uuid("Некорректный идентификатор товара"),
  files: z
    .array(
      z.object({
        filename: z.string().min(1, "Имя файла обязательно"),
        contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
          errorMap: () => ({
            message:
              "Поддерживаются только изображения JPEG, PNG, WebP и HEIC/HEIF",
          }),
        }),
        size: z
          .number()
          .max(
            MAX_IMAGE_SIZE_BYTES,
            "Размер файла не должен превышать 15 МБ"
          ),
      })
    )
    .min(1, "Необходимо указать хотя бы один файл"),
});

export const saveMediaRecordSchema = z.object({
  productId: z.string().uuid("Некорректный идентификатор товара"),
  mediaId: z.string().uuid().optional(),
  url: z.string().min(1, "URL изображения обязателен"),
  storageKey: z.string().optional(),
  blurDataUrl: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});
