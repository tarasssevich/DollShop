"use server";

import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { orders, orderItems, products, productMedia } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { setOrderStatus } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";

export interface AdminOrderItem {
  id: string;
  orderNumber: number;
  publicToken: string;
  customerName: string;
  customerPhone: string;
  customerContact: string | null;
  contactChannel: "telegram" | "viber" | "call";
  deliveryCity: string;
  deliveryBranch: string;
  comment: string | null;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "completed";
  paymentMethod: "erip_invoice" | "bank_transfer" | "cod" | "online_card" | "online_erip";
  trackingNumber: string | null;
  createdAt: string;
  doll: {
    id: string;
    title: string;
    slug: string;
    price: number;
    coverUrl: string | null;
  } | null;
}

/**
 * Получение списка всех заказов для админ-панели мастера (Step 5.5).
 */
export async function getAdminOrdersAction(): Promise<{
  success: boolean;
  orders: AdminOrderItem[];
  error?: string;
}> {
  await requireAdminAction();

  try {
    const rawOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const result: AdminOrderItem[] = [];

    for (const ord of rawOrders) {
      const [itemRow] = await db
        .select({
          productId: orderItems.productId,
          priceAtPurchase: orderItems.priceAtPurchase,
          title: products.title,
          slug: products.slug,
        })
        .from(orderItems)
        .innerJoin(products, eq(products.id, orderItems.productId))
        .where(eq(orderItems.orderId, ord.id));

      let coverUrl: string | null = null;
      if (itemRow?.productId) {
        const [mediaRow] = await db
          .select({ url: productMedia.url })
          .from(productMedia)
          .where(eq(productMedia.productId, itemRow.productId))
          .orderBy(productMedia.displayOrder)
          .limit(1);

        coverUrl = mediaRow?.url ?? null;
      }

      result.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        publicToken: ord.publicToken,
        customerName: ord.customerName,
        customerPhone: ord.customerPhone,
        customerContact: ord.customerContact,
        contactChannel: ord.contactChannel as "telegram" | "viber" | "call",
        deliveryCity: ord.deliveryCity,
        deliveryBranch: ord.deliveryBranch,
        comment: ord.comment,
        totalAmount: parseFloat(ord.totalAmount),
        status: ord.status as "pending" | "paid" | "cancelled" | "completed",
        paymentMethod: ord.paymentMethod as
          | "erip_invoice"
          | "bank_transfer"
          | "cod"
          | "online_card"
          | "online_erip",
        trackingNumber: ord.trackingNumber,
        createdAt: ord.createdAt.toISOString(),
        doll: itemRow
          ? {
              id: itemRow.productId,
              title: itemRow.title,
              slug: itemRow.slug,
              price: parseFloat(itemRow.priceAtPurchase),
              coverUrl,
            }
          : null,
      });
    }

    return { success: true, orders: result };
  } catch (err) {
    console.error("Ошибка при получении списка заказов в админке:", err);
    return { success: false, orders: [], error: "Не удалось загрузить заказы" };
  }
}

const updateStatusSchema = z.object({
  orderId: z.string().uuid("Некорректный идентификатор заказа"),
  status: z.enum(["pending", "paid", "cancelled", "completed"]),
});

/**
 * Смена статуса заказа мастером с автоматической синхронизацией статуса куклы.
 */
export async function updateAdminOrderStatusAction(
  input: z.infer<typeof updateStatusSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры запроса" };
  }

  const { orderId, status } = parsed.data;

  try {
    const res = await setOrderStatus(orderId, status);
    if (res.errorCode) {
      return { success: false, error: `Ошибка базы данных: ${res.errorCode}` };
    }

    try {
      revalidateTag(CACHE_TAGS.products, "max-age=0");
      if (res.productSlug) {
        revalidateTag(CACHE_TAGS.product(res.productSlug), "max-age=0");
      }
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка смены статуса заказа:", err);
    return { success: false, error: "Не удалось обновить статус заказа" };
  }
}

const updateTrackingSchema = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().trim().min(5, "Трек-номер слишком короткий").max(40),
});

/**
 * Добавление или обновление почтового трек-номера заказа.
 */
export async function updateAdminOrderTrackingAction(
  input: z.infer<typeof updateTrackingSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = updateTrackingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректный трек-номер" };
  }

  const { orderId, trackingNumber } = parsed.data;

  try {
    await db
      .update(orders)
      .set({ trackingNumber, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return { success: true };
  } catch (err) {
    console.error("Ошибка сохранения трек-номера:", err);
    return { success: false, error: "Не удалось сохранить трек-номер" };
  }
}
