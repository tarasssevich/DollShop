import "server-only";
import { client } from "./client";

export type ReserveResult = {
  status: "SUCCESS" | "ERROR";
  reservedUntil: Date | null;
  errorCode: string | null;
};

export type CreateOrderParams = {
  productId: string;
  tokenHash: string;
  customerName: string;
  customerPhone: string;
  customerContact?: string | null;
  contactChannel?: "telegram" | "viber" | "call";
  deliveryCity: string;
  deliveryBranch: string;
  comment?: string | null;
  paymentMethod?: "erip_invoice" | "bank_transfer" | "cod" | "online_card" | "online_erip";
  pdConsentAt?: Date;
  holdHours?: number;
};

export type CreateOrderResult = {
  orderId: string | null;
  orderNumber: number | null;
  publicToken: string | null;
  totalAmount: string | null;
  errorCode: string | null;
};

export type SetOrderStatusResult = {
  orderId: string | null;
  status: string | null;
  productId: string | null;
  productStatus: string | null;
  productSlug: string | null;
  errorCode: string | null;
};

export type ExpiredReservationItem = {
  productId: string;
  slug: string;
};

/**
 * Атомарная бронь куклы на уровне строк PostgreSQL.
 * Гарантирует победу ровно одной транзакции при дропе.
 */
export async function reserveProduct(
  productId: string,
  tokenHash: string,
  ttlMinutes: number = 15
): Promise<ReserveResult> {
  const [row] = await client<
    Array<{
      out_status: "SUCCESS" | "ERROR";
      out_reserved_until: Date | null;
      out_error_code: string | null;
    }>
  >`
    SELECT out_status, out_reserved_until, out_error_code 
    FROM reserve_product(${productId}::uuid, ${tokenHash}, ${ttlMinutes});
  `;

  return {
    status: row?.out_status ?? "ERROR",
    reservedUntil: row?.out_reserved_until ? new Date(row.out_reserved_until) : null,
    errorCode: row?.out_error_code ?? null,
  };
}

/**
 * Добровольное освобождение брони покупателем.
 */
export async function releaseReservation(
  productId: string,
  tokenHash: string
): Promise<boolean> {
  const [row] = await client<Array<{ release_reservation: boolean }>>`
    SELECT release_reservation(${productId}::uuid, ${tokenHash});
  `;

  return Boolean(row?.release_reservation);
}

/**
 * Атомарное создание заказа с валидацией токена и ценой из БД.
 */
export async function createOrder(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const consentIso = (params.pdConsentAt ?? new Date()).toISOString();

  const [row] = await client<
    Array<{
      out_order_id: string | null;
      out_order_number: number | null;
      out_public_token: string | null;
      out_total_amount: string | null;
      out_error_code: string | null;
    }>
  >`
    SELECT out_order_id, out_order_number, out_public_token, out_total_amount, out_error_code
    FROM create_order(
      ${params.productId}::uuid,
      ${params.tokenHash},
      ${params.customerName},
      ${params.customerPhone},
      ${params.customerContact ?? null},
      ${params.contactChannel ?? "telegram"},
      ${params.deliveryCity},
      ${params.deliveryBranch},
      ${params.comment ?? null},
      ${params.paymentMethod ?? "erip_invoice"},
      ${consentIso}::timestamptz,
      ${params.holdHours ?? 24}
    );
  `;

  return {
    orderId: row?.out_order_id ?? null,
    orderNumber: row?.out_order_number ?? null,
    publicToken: row?.out_public_token ?? null,
    totalAmount: row?.out_total_amount ? String(row.out_total_amount) : null,
    errorCode: row?.out_error_code ?? null,
  };
}

/**
 * Смена статуса заказа и синхронное обновление статуса куклы.
 */
export async function setOrderStatus(
  orderId: string,
  newStatus: "pending" | "paid" | "cancelled" | "completed"
): Promise<SetOrderStatusResult> {
  const [row] = await client<
    Array<{
      out_order_id: string | null;
      out_status: string | null;
      out_product_id: string | null;
      out_product_status: string | null;
      out_product_slug: string | null;
      out_error_code: string | null;
    }>
  >`
    SELECT out_order_id, out_status, out_product_id, out_product_status, out_product_slug, out_error_code
    FROM set_order_status(${orderId}::uuid, ${newStatus});
  `;

  return {
    orderId: row?.out_order_id ?? null,
    status: row?.out_status ?? null,
    productId: row?.out_product_id ?? null,
    productStatus: row?.out_product_status ?? null,
    productSlug: row?.out_product_slug ?? null,
    errorCode: row?.out_error_code ?? null,
  };
}

/**
 * Освобождение истёкших броней cron-процессом.
 * Возвращает slug затронутых кукол для сброса ISR-кэша.
 */
export async function expireReservations(): Promise<ExpiredReservationItem[]> {
  const rows = await client<
    Array<{
      out_product_id: string;
      out_slug: string;
    }>
  >`
    SELECT out_product_id, out_slug FROM expire_reservations();
  `;

  return rows.map((r) => ({
    productId: r.out_product_id,
    slug: r.out_slug,
  }));
}
