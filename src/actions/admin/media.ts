"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { productMedia, products } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { requireAdminAction } from "@/lib/auth/guard";
import { getStorageAdapter, type UploadUrlResult } from "@/lib/storage";

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

export interface MediaUploadItemResult {
  mediaId: string;
  variants: {
    "2000": UploadUrlResult;
    "1280": UploadUrlResult;
    "640": UploadUrlResult;
  };
}

export type CreateUploadUrlsResult =
  | { success: true; items: MediaUploadItemResult[] }
  | { success: false; error: string };

/**
 * Создает presigned URL-ы для параллельной загрузки 3-х WebP вариантов каждого изображения.
 * Ключи: products/{productId}/{mediaId}/{size}.webp
 */
export async function createUploadUrlsAction(
  input: unknown
): Promise<CreateUploadUrlsResult> {
  await requireAdminAction();

  const parsed = createUploadUrlsSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const { productId, files } = parsed.data;
  const adapter = getStorageAdapter();

  try {
    const items: MediaUploadItemResult[] = [];

    for (const _file of files) {
      const mediaId = crypto.randomUUID();

      const key2000 = `products/${productId}/${mediaId}/2000.webp`;
      const key1280 = `products/${productId}/${mediaId}/1280.webp`;
      const key640 = `products/${productId}/${mediaId}/640.webp`;

      const [res2000, res1280, res640] = await Promise.all([
        adapter.createUploadUrl({
          key: key2000,
          contentType: "image/webp",
          expiresInSeconds: 300,
        }),
        adapter.createUploadUrl({
          key: key1280,
          contentType: "image/webp",
          expiresInSeconds: 300,
        }),
        adapter.createUploadUrl({
          key: key640,
          contentType: "image/webp",
          expiresInSeconds: 300,
        }),
      ]);

      items.push({
        mediaId,
        variants: {
          "2000": res2000,
          "1280": res1280,
          "640": res640,
        },
      });
    }

    return { success: true, items };
  } catch (err) {
    console.error("Ошибка при создании presigned URL:", err);
    return {
      success: false,
      error: "Не удалось сформировать ссылки для загрузки файлов",
    };
  }
}

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

export type SaveMediaRecordResult =
  | { success: true; media: typeof productMedia.$inferSelect }
  | { success: false; error: string };

/**
 * Сохраняет запись о загруженном медиа-файле в базу данных.
 */
export async function saveProductMediaAction(
  input: unknown
): Promise<SaveMediaRecordResult> {
  await requireAdminAction();

  const parsed = saveMediaRecordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const data = parsed.data;

  try {
    // Получаем текущие медиа куклы для определения порядка
    let nextOrder = data.displayOrder;
    if (nextOrder === undefined) {
      const existing = await db
        .select({ displayOrder: productMedia.displayOrder })
        .from(productMedia)
        .where(eq(productMedia.productId, data.productId))
        .orderBy(asc(productMedia.displayOrder));

      const lastOrder = existing[existing.length - 1]?.displayOrder ?? -1;
      nextOrder = lastOrder + 1;
    }

    const [saved] = await db
      .insert(productMedia)
      .values({
        id: data.mediaId ?? crypto.randomUUID(),
        productId: data.productId,
        url: data.url,
        mediaType: "image",
        displayOrder: nextOrder,
        blurDataUrl: data.blurDataUrl ?? null,
        storageKey: data.storageKey ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        alt: data.alt ?? null,
      })
      .returning();

    if (!saved) {
      return { success: false, error: "Не удалось сохранить медиа в БД" };
    }

    // Инвалидируем кэш каталога
    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, data.productId));

    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    if (product) {
      revalidateTag(CACHE_TAGS.product(product.slug), { expire: 0 });
    }

    return { success: true, media: saved };
  } catch (err) {
    console.error("Ошибка при сохранении медиа-записи:", err);
    return {
      success: false,
      error: "Произошла ошибка при сохранении медиа-файла",
    };
  }
}

/**
 * Удаляет медиа-файл из БД и хранилища S3/локального.
 */
export async function deleteProductMediaAction(input: {
  id: string;
  productId: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  try {
    const [media] = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.id, input.id));

    if (!media) {
      return { success: false, error: "Медиа-файл не найден" };
    }

    // Удаляем из базы
    await db.delete(productMedia).where(eq(productMedia.id, input.id));

    // Удаляем из хранилища
    if (media.storageKey) {
      const adapter = getStorageAdapter();
      // Удаляем возможные варианты размера
      const baseKey = media.storageKey.replace(/\/\d+\.webp$/, "");
      await Promise.allSettled([
        adapter.deleteObject(`${baseKey}/2000.webp`),
        adapter.deleteObject(`${baseKey}/1280.webp`),
        adapter.deleteObject(`${baseKey}/640.webp`),
      ]);
    }

    // Инвалидируем кэш
    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, input.productId));

    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    if (product) {
      revalidateTag(CACHE_TAGS.product(product.slug), { expire: 0 });
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка при удалении медиа:", err);
    return { success: false, error: "Не удалось удалить медиа-файл" };
  }
}

/**
 * Изменяет порядок отображения медиа-файлов куклы.
 */
export async function reorderProductMediaAction(input: {
  productId: string;
  mediaIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  try {
    await Promise.all(
      input.mediaIds.map((id, index) =>
        db
          .update(productMedia)
          .set({ displayOrder: index })
          .where(eq(productMedia.id, id))
      )
    );

    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, input.productId));

    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    if (product) {
      revalidateTag(CACHE_TAGS.product(product.slug), { expire: 0 });
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка при изменении порядка медиа:", err);
    return { success: false, error: "Не удалось сохранить новый порядок" };
  }
}
