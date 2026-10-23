"use server";

import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db, client } from "@/db/client";
import { products, reservations } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache/tags";

/**
 * Серверный хелпер для интерактивного Тест-центра (/demo).
 * Гарантирует наличие хотя бы одной доступной куклы для тестирования чекаута.
 */
export async function ensureAvailableTestDollAction(): Promise<{
  success: boolean;
  slug: string;
  title: string;
  error?: string;
}> {
  try {
    // 1. Ищем существующую куклу со статусом 'available'
    const [available] = await db
      .select()
      .from(products)
      .where(eq(products.status, "available"))
      .limit(1);

    if (available) {
      // Очищаем зависшие брони, если были
      await db.delete(reservations).where(eq(reservations.productId, available.id));
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      return {
        success: true,
        slug: available.slug,
        title: available.title,
      };
    }

    // 2. Если свободных кукол нет, переводим одну из 'sold' или 'reserved' в 'available'
    const [anyDoll] = await db
      .select()
      .from(products)
      .limit(1);

    if (anyDoll) {
      await db.delete(reservations).where(eq(reservations.productId, anyDoll.id));
      await db
        .update(products)
        .set({ status: "available" })
        .where(eq(products.id, anyDoll.id));

      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(anyDoll.slug), { expire: 0 });
      return {
        success: true,
        slug: anyDoll.slug,
        title: anyDoll.title,
      };
    }

    // 3. Если кукол вообще нет, создаем новую
    const slug = `fairy-demo-${Date.now()}`;
    const title = "Лесная Фея Незабудка (Демо)";
    const [newDoll] = await client<Array<{ id: string; slug: string; title: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status, is_featured)
      VALUES (
        ${slug},
        ${title},
        'Нежная интерьерная фея ручной работы с крыльями из березового шпона и платьем с ромашками.',
        '{"height_cm": 24, "materials": ["Хлопок", "Дерево", "Фатин", "Бусины"]}'::jsonb,
        140.00,
        'BYN',
        'available',
        true
      )
      RETURNING id, slug, title;
    `;

    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    return {
      success: true,
      slug: newDoll!.slug,
      title: newDoll!.title,
    };
  } catch (err) {
    console.error("Ошибка в ensureAvailableTestDollAction:", err);
    return {
      success: false,
      slug: "",
      title: "",
      error: "Не удалось подготовить куклу для теста",
    };
  }
}
