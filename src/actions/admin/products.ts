"use server";

import { z } from "zod";
import { eq, ne } from "drizzle-orm";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { products, type ProductSpecs } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { slugify } from "@/lib/utils/slugify";
import { CACHE_TAGS } from "@/lib/cache/tags";

export const productFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string({ required_error: "Введите название куклы" })
    .min(2, "Название куклы должно быть не короче 2 символов")
    .max(120, "Название слишком длинное (максимум 120 символов)"),
  story: z
    .string({ required_error: "Напишите историю или описание куклы" })
    .min(5, "Описание куклы должно быть не короче 5 символов"),
  price: z
    .number({ required_error: "Укажите цену в белорусских рублях" })
    .positive("Цена должна быть больше нуля")
    .max(10000, "Цена не может превышать 10 000 BYN"),
  heightCm: z
    .number({ required_error: "Укажите рост куклы в сантиметрах" })
    .int("Рост должен быть целым числом")
    .min(5, "Рост должен быть не менее 5 см")
    .max(150, "Рост не может превышать 150 см"),
  collection: z.string().max(80).optional().default("Авторская серия"),
  materials: z.array(z.string().min(1)).min(1, "Добавьте хотя бы один материал"),
  status: z.enum(["available", "sold", "made_to_order", "draft"]),
  isFeatured: z.boolean().default(false),
  details: z
    .object({
      wingMaterial: z.string().optional(),
      hairMaterial: z.string().optional(),
      dressMaterial: z.string().optional(),
      bouquetDetails: z.string().optional(),
      hangingLoopIncluded: z.boolean().default(true),
      boxIncluded: z.boolean().default(true),
      certificateIncluded: z.boolean().default(true),
    })
    .optional(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

/**
 * Генерирует уникальный slug для куклы с защитой от коллизий.
 */
async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title) || "feya";
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(
        excludeId
          ? eq(products.slug, candidate) && ne(products.id, excludeId)
          : eq(products.slug, candidate)
      );

    if (existing.length === 0) {
      return candidate;
    }

    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

/**
 * Создание или сохранение куклы мастером.
 */
export async function saveProductAction(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdminAction();

    const parsed = productFormSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Пожалуйста, проверьте правильность заполнения полей",
        issues: parsed.error.issues,
      };
    }

    const data = parsed.data;
    const specs: ProductSpecs = {
      height_cm: data.heightCm,
      materials: data.materials,
      collection: data.collection || "Авторская серия",
      category: "fairies",
      year: new Date().getFullYear(),
      details: {
        wingMaterial: data.details?.wingMaterial || "Резное дерево",
        hairMaterial: data.details?.hairMaterial || "Хлопковая пряжа",
        dressMaterial: data.details?.dressMaterial || "Хлопок / Фатин",
        bouquetDetails: data.details?.bouquetDetails || "Сухоцветы",
        hangingLoopIncluded: data.details?.hangingLoopIncluded ?? true,
        boxIncluded: data.details?.boxIncluded ?? true,
        certificateIncluded: data.details?.certificateIncluded ?? true,
      },
    };

    if (data.id) {
      // Обновление существующей куклы
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, data.id));

      if (!existing) {
        return { success: false, error: "Кукла не найдена в базе данных" };
      }

      await db
        .update(products)
        .set({
          title: data.title,
          story: data.story,
          price: data.price.toFixed(2),
          status: data.status,
          specs,
          isFeatured: data.isFeatured,
          updatedAt: new Date(),
        })
        .where(eq(products.id, data.id));

      // Инвалидация кэша Next.js ISR и обновление витрины и админки
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
        revalidateTag(CACHE_TAGS.product(existing.slug), { expire: 0 });
        revalidatePath("/", "page");
        revalidatePath("/kukly", "page");
        revalidatePath(`/kukly/${existing.slug}`, "page");
        revalidatePath("/cart", "page");
        revalidatePath("/galereya", "page");
        revalidatePath("/admin/kukly", "page");
      } catch {
        // Игнорируем вне Next.js
      }

      return {
        success: true,
        data: { id: data.id, slug: existing.slug },
      };
    } else {
      // Создание новой куклы (автогенерация slug и постановка на первое место)
      const slug = await generateUniqueSlug(data.title);

      const [created] = await db
        .insert(products)
        .values({
          slug,
          title: data.title,
          story: data.story,
          price: data.price.toFixed(2),
          currency: "BYN",
          status: data.status,
          specs,
          isFeatured: data.isFeatured,
          sortOrder: 0,
        })
        .returning({ id: products.id, slug: products.slug });

      if (!created) {
        return { success: false, error: "Не удалось сохранить куклу" };
      }

      // Инвалидация кэша Next.js ISR и обновление витрины и админки
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
        revalidateTag(CACHE_TAGS.product(slug), { expire: 0 });
        revalidatePath("/", "page");
        revalidatePath("/kukly", "page");
        revalidatePath(`/kukly/${slug}`, "page");
        revalidatePath("/cart", "page");
        revalidatePath("/galereya", "page");
        revalidatePath("/admin/kukly", "page");
      } catch {
        // Игнорируем вне Next.js
      }

      return {
        success: true,
        data: { id: created.id, slug: created.slug },
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return { success: false, error: message };
  }
}

/**
 * Удаление куклы мастером.
 */
export async function deleteProductAction(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    await requireAdminAction();

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ slug: products.slug });

    if (!deleted) {
      return { success: false, error: "Кукла не найдена" };
    }

    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(deleted.slug), { expire: 0 });
      revalidatePath("/", "page");
      revalidatePath("/kukly", "page");
      revalidatePath(`/kukly/${deleted.slug}`, "page");
      revalidatePath("/cart", "page");
      revalidatePath("/galereya", "page");
      revalidatePath("/admin/kukly", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true, data: { deleted: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return { success: false, error: message };
  }
}
