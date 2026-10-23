"use server";

import crypto from "node:crypto";
import { eq, gt, desc, sql, inArray, asc } from "drizzle-orm";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  products,
  reservations,
  orders,
  customRequests,
  productMedia,
} from "@/db/schema";
import { expireReservations } from "@/db/functions";
import { requireAdminAction } from "@/lib/auth/guard";
import { CACHE_TAGS } from "@/lib/cache/tags";

export interface ActiveReservationDto {
  productId: string;
  slug: string;
  title: string;
  priceByn: number;
  coverUrl: string | null;
  reservedUntil: string;
  secondsRemaining: number;
}

export interface AdminLiveEvent {
  type: "reservation" | "order" | "request";
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface AdminLiveState {
  stateHash: string;
  timestamp: string;
  activeReservations: ActiveReservationDto[];
  pendingOrdersCount: number;
  newRequestsCount: number;
  availableProductsCount: number;
  soldProductsCount: number;
  latestEvent?: AdminLiveEvent | null;
}

/**
 * Получение текущего live-состояния магазина для панели мастера.
 * Включает:
 * - Автоочистку истёкших броней в БД (expireReservations);
 * - Активные брони с посекундным временем до истечения;
 * - Счётчики новых заказов (pending) и заявок (new);
 * - Уникальный stateHash для мгновенного обнаружения изменений на клиенте.
 */
export async function getAdminLiveStateAction(): Promise<AdminLiveState> {
  await requireAdminAction();

  const now = new Date();

  // 1. Автоочистка истёкших броней в БД
  try {
    const expired = await expireReservations();
    if (expired.length > 0) {
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
        for (const item of expired) {
          revalidateTag(CACHE_TAGS.product(item.slug), { expire: 0 });
          revalidatePath(`/kukly/${item.slug}`, "page");
        }
        revalidatePath("/", "page");
        revalidatePath("/kukly", "page");
        revalidatePath("/cart", "page");
        revalidatePath("/admin/kukly", "page");
      } catch {
        // Игнорируем вне контекста Next.js запроса
      }
    }
  } catch (err) {
    console.error("Ошибка автоочистки истёкших броней:", err);
  }

  // 2. Выборка активных броней
  const activeResRows = await db
    .select({
      productId: reservations.productId,
      tokenHash: reservations.tokenHash,
      expiresAt: reservations.expiresAt,
      resCreatedAt: reservations.createdAt,
      slug: products.slug,
      title: products.title,
      price: products.price,
      status: products.status,
    })
    .from(reservations)
    .innerJoin(products, eq(reservations.productId, products.id))
    .where(gt(reservations.expiresAt, now))
    .orderBy(desc(reservations.createdAt));

  // O(1) batch query: обложки кукол
  const productIds = activeResRows.map((r) => r.productId);
  const coversByProductId = new Map<string, string>();

  if (productIds.length > 0) {
    const mediaRows = await db
      .select({
        productId: productMedia.productId,
        url: productMedia.url,
      })
      .from(productMedia)
      .where(inArray(productMedia.productId, productIds))
      .orderBy(asc(productMedia.displayOrder));

    for (const m of mediaRows) {
      if (!coversByProductId.has(m.productId)) {
        coversByProductId.set(m.productId, m.url);
      }
    }
  }

  const activeReservations: ActiveReservationDto[] = activeResRows.map((r) => {
    const secondsRemaining = Math.max(
      0,
      Math.floor((r.expiresAt.getTime() - Date.now()) / 1000)
    );

    return {
      productId: r.productId,
      slug: r.slug,
      title: r.title,
      priceByn: parseFloat(r.price),
      coverUrl: coversByProductId.get(r.productId) || null,
      reservedUntil: r.expiresAt.toISOString(),
      secondsRemaining,
    };
  });

  // 3. Подсчёт счётчиков заказов и заявок
  const [ordersSummary] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      pendingCount: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
      maxUpdatedAt: sql<string | null>`max(${orders.updatedAt})`,
      maxCreatedAt: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(orders);

  const [requestsSummary] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      newCount: sql<number>`count(*) filter (where ${customRequests.status} = 'new')::int`,
      maxUpdatedAt: sql<string | null>`max(${customRequests.updatedAt})`,
      maxCreatedAt: sql<string | null>`max(${customRequests.createdAt})`,
    })
    .from(customRequests);

  const [productsSummary] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      availableCount: sql<number>`count(*) filter (where ${products.status} = 'available')::int`,
      soldCount: sql<number>`count(*) filter (where ${products.status} = 'sold')::int`,
      reservedCount: sql<number>`count(*) filter (where ${products.status} = 'reserved')::int`,
      maxUpdatedAt: sql<string | null>`max(${products.updatedAt})`,
    })
    .from(products);

  const pendingOrdersCount = ordersSummary?.pendingCount ?? 0;
  const newRequestsCount = requestsSummary?.newCount ?? 0;
  const availableProductsCount = productsSummary?.availableCount ?? 0;
  const soldProductsCount = productsSummary?.soldCount ?? 0;

  // 4. Генерация stateHash
  const hashInput = [
    ordersSummary?.totalCount ?? 0,
    ordersSummary?.pendingCount ?? 0,
    ordersSummary?.maxUpdatedAt ?? "",
    ordersSummary?.maxCreatedAt ?? "",
    requestsSummary?.totalCount ?? 0,
    requestsSummary?.newCount ?? 0,
    requestsSummary?.maxUpdatedAt ?? "",
    requestsSummary?.maxCreatedAt ?? "",
    productsSummary?.totalCount ?? 0,
    productsSummary?.availableCount ?? 0,
    productsSummary?.soldCount ?? 0,
    productsSummary?.reservedCount ?? 0,
    productsSummary?.maxUpdatedAt ?? "",
    activeReservations.length,
    activeReservations.map((r) => `${r.productId}:${r.secondsRemaining}`).join(","),
  ].join("|");

  const stateHash = crypto.createHash("md5").update(hashInput).digest("hex");

  // 5. Определение последнего события (за последние 25 секунд) для всплывающего уведомления
  let latestEvent: AdminLiveEvent | null = null;
  const twentyFiveSecAgo = new Date(Date.now() - 25 * 1000);

  // Проверяем свежую бронь
  const freshRes = activeResRows[0];
  if (freshRes && freshRes.resCreatedAt >= twentyFiveSecAgo) {
    latestEvent = {
      type: "reservation",
      id: freshRes.productId,
      title: "Новая бронь куклы",
      message: `Покупатель забронировал «${freshRes.title}» (${parseFloat(freshRes.price)} BYN)`,
      createdAt: freshRes.resCreatedAt.toISOString(),
    };
  }

  // Проверяем свежий заказ
  if (!latestEvent) {
    const [freshOrder] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(gt(orders.createdAt, twentyFiveSecAgo))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    if (freshOrder) {
      latestEvent = {
        type: "order",
        id: freshOrder.id,
        title: `Новый заказ №${freshOrder.orderNumber}`,
        message: `${freshOrder.customerName} оформил(а) заказ на сумму ${parseFloat(freshOrder.totalAmount)} BYN`,
        createdAt: freshOrder.createdAt.toISOString(),
      };
    }
  }

  // Проверяем свежую заявку «На заказ»
  if (!latestEvent) {
    const [freshReq] = await db
      .select({
        id: customRequests.id,
        customerName: customRequests.customerName,
        createdAt: customRequests.createdAt,
      })
      .from(customRequests)
      .where(gt(customRequests.createdAt, twentyFiveSecAgo))
      .orderBy(desc(customRequests.createdAt))
      .limit(1);

    if (freshReq) {
      latestEvent = {
        type: "request",
        id: freshReq.id,
        title: "Новая индивидуальная заявка",
        message: `${freshReq.customerName} отправил(а) пожелания к кукле на заказ`,
        createdAt: freshReq.createdAt.toISOString(),
      };
    }
  }

  return {
    stateHash,
    timestamp: now.toISOString(),
    activeReservations,
    pendingOrdersCount,
    newRequestsCount,
    availableProductsCount,
    soldProductsCount,
    latestEvent,
  };
}

/**
 * Принудительное снятие брони администратором магазина.
 * Мгновенно удаляет запись из reservations, переводит куклу в статус available,
 * обнуляет таймер и инвалидирует кэш витрины и админки.
 */
export async function adminReleaseReservationAction(input: {
  productId: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const { productId } = input;
  if (!productId) {
    return { success: false, error: "Идентификатор куклы обязателен" };
  }

  try {
    const [prod] = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        status: products.status,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!prod) {
      return { success: false, error: "Кукла не найдена в базе данных" };
    }

    // Удаляем запись брони
    await db.delete(reservations).where(eq(reservations.productId, productId));

    // Возвращаем куклу в наличие
    await db
      .update(products)
      .set({
        status: "available",
        reservedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Мгновенная инвалидация всех витринных и админских страниц
    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(prod.slug), { expire: 0 });
      revalidatePath("/", "page");
      revalidatePath("/kukly", "page");
      revalidatePath(`/kukly/${prod.slug}`, "page");
      revalidatePath("/cart", "page");
      revalidatePath("/admin/kukly", "page");
      revalidatePath("/admin/zakazy", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка при принудительном снятии брони администратором:", err);
    return {
      success: false,
      error: "Не удалось снять бронь. Пожалуйста, повторите попытку.",
    };
  }
}
