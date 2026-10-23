import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders, orderItems, products, productMedia } from "@/db/schema";

export interface OrderWithDetails {
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
  createdAt: Date;
  item: {
    productId: string;
    productTitle: string;
    productSlug: string;
    priceAtPurchase: number;
    coverUrl: string | null;
  } | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Получение данных оформленного заказа по публичному UUID-токену.
 * Безопасно для показа покупателю на странице /zakaz/[token].
 */
export async function getOrderByPublicToken(
  publicToken: string
): Promise<OrderWithDetails | null> {
  if (!publicToken || !UUID_REGEX.test(publicToken)) {
    return null;
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicToken, publicToken));

  if (!order) {
    return null;
  }

  // Получаем позицию заказа и куклу
  const [itemRow] = await db
    .select({
      productId: orderItems.productId,
      priceAtPurchase: orderItems.priceAtPurchase,
      title: products.title,
      slug: products.slug,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, order.id));

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

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    publicToken: order.publicToken,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerContact: order.customerContact,
    contactChannel: order.contactChannel as "telegram" | "viber" | "call",
    deliveryCity: order.deliveryCity,
    deliveryBranch: order.deliveryBranch,
    comment: order.comment,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status as "pending" | "paid" | "cancelled" | "completed",
    paymentMethod: order.paymentMethod as
      | "erip_invoice"
      | "bank_transfer"
      | "cod"
      | "online_card"
      | "online_erip",
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    item: itemRow
      ? {
          productId: itemRow.productId,
          productTitle: itemRow.title,
          productSlug: itemRow.slug,
          priceAtPurchase: parseFloat(itemRow.priceAtPurchase),
          coverUrl,
        }
      : null,
  };
}
