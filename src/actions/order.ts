"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { createOrder } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  getReservationCookieName,
  hashReservationToken,
} from "@/lib/reservation/token";
import { normalizeBelarusPhone } from "@/lib/utils/phone";
import { notifyNewOrder } from "@/lib/notify/telegram";
import { getPaymentProvider } from "@/lib/payments/bepaid";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { orderFormSchema } from "@/lib/schemas/order-form";
import {
  getOrdersByCustomerPhone,
  getOrdersByPublicTokens,
} from "@/lib/data/orders";

export type OrderFormInput = z.infer<typeof orderFormSchema>;

export type CreateOrderActionResult =
  | {
      success: true;
      orderNumber: number;
      publicToken: string;
      redirectUrl: string;
    }
  | {
      success: false;
      code:
        | "RESERVATION_EXPIRED"
        | "INVALID_RESERVATION"
        | "ORDER_ALREADY_EXISTS"
        | "VALIDATION_ERROR"
        | "SERVER_ERROR";
      error: string;
      issues?: z.ZodIssue[];
    };

/**
 * Server Action создания заказа (Step 5.2).
 * Проверяет наличие токена брони в httpOnly cookie, валидирует форму чекаута,
 * вызывает атомарную хранимую функцию `create_order` в PostgreSQL,
 * очищает cookie брони, сбрасывает кэш витрины и отправляет уведомление мастеру в Telegram (Step 5.3).
 */
export async function createOrderAction(
  input: unknown
): Promise<CreateOrderActionResult> {
  const parsed = orderFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message || "Пожалуйста, проверьте данные формы",
      issues: parsed.error.issues,
    };
  }

  const data = parsed.data;

  // Honeypot защита от ботов
  if (data.honeypot && data.honeypot.length > 0) {
    return {
      success: true,
      orderNumber: 0,
      publicToken: "honeypot",
      redirectUrl: "/",
    };
  }

  const cookieStore = await cookies();
  const cookieName = getReservationCookieName(data.productId);
  const rawToken = cookieStore.get(cookieName)?.value;

  if (!rawToken) {
    return {
      success: false,
      code: "RESERVATION_EXPIRED",
      error:
        "Время действия вашей 15-минутной брони истекло. Пожалуйста, вернитесь на страницу куклы, чтобы оформить бронь повторно.",
    };
  }

  const tokenHash = hashReservationToken(rawToken);
  const normalizedPhone = normalizeBelarusPhone(data.customerPhone);
  if (!normalizedPhone) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Номер телефона должен быть в формате Беларуси (+375...)",
    };
  }

  const city =
    data.deliveryType === "postal"
      ? data.deliveryCity!.trim()
      : "Минск";

  const branch =
    data.deliveryType === "postal"
      ? data.deliveryBranch!.trim()
      : "Самовывоз по согласованию с мастером";

  try {
    const res = await createOrder({
      productId: data.productId,
      tokenHash,
      customerName: data.customerName,
      customerPhone: normalizedPhone,
      customerContact: data.customerContact?.trim() || null,
      contactChannel: data.contactChannel,
      deliveryCity: city,
      deliveryBranch: branch,
      comment: data.comment?.trim() || null,
      paymentMethod: data.paymentMethod,
      pdConsentAt: new Date(),
      holdHours: 24, // Бронь продлевается на 24 часа для согласования оплаты
    });

    if (res.errorCode) {
      switch (res.errorCode) {
        case "RESERVATION_EXPIRED":
          return {
            success: false,
            code: "RESERVATION_EXPIRED",
            error:
              "Срок бронирования куклы истек (15 минут). Кукла вернулась в свободную продажу.",
          };
        case "INVALID_RESERVATION":
          return {
            success: false,
            code: "INVALID_RESERVATION",
            error:
              "Бронь недействительна или была оформлена в другом окне браузера.",
          };
        case "ORDER_ALREADY_EXISTS":
          return {
            success: false,
            code: "ORDER_ALREADY_EXISTS",
            error:
              "Заказ на эту куклу уже был успешно создан ранее.",
          };
        default:
          return {
            success: false,
            code: "SERVER_ERROR",
            error: "Не удалось оформить заказ. Пожалуйста, попробуйте еще раз.",
          };
      }
    }

    if (!res.orderId || !res.orderNumber || !res.publicToken) {
      return {
        success: false,
        code: "SERVER_ERROR",
        error: "Не удалось сохранить заказ в базе данных.",
      };
    }

    // Удаляем cookie временной брони (теперь кукла удерживается заказом в статусе pending)
    cookieStore.delete(cookieName);

    // Сохраняем публичный токен в cookie покупателя (для раздела "Мои заказы" в корзине)
    try {
      const existingCookie = cookieStore.get("dollshop_order_tokens")?.value || "";
      const tokens = existingCookie ? existingCookie.split(",").filter(Boolean) : [];
      if (!tokens.includes(res.publicToken)) {
        tokens.unshift(res.publicToken);
      }
      cookieStore.set("dollshop_order_tokens", tokens.slice(0, 10).join(","), {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
      });
    } catch {
      // Игнорируем вне Next.js
    }

    // Сбрасываем кэш каталога и обновляем страницы витрины и панели мастера
    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(data.slug), { expire: 0 });
      revalidatePath("/", "page");
      revalidatePath("/kukly", "page");
      revalidatePath(`/kukly/${data.slug}`, "page");
      revalidatePath("/cart", "page");
      revalidatePath("/admin/zakazy", "page");
      revalidatePath("/admin/kukly", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    // Отправка уведомления мастеру в Telegram (Step 5.3)
    try {
      await notifyNewOrder({
        orderNumber: res.orderNumber,
        orderId: res.orderId,
        dollName: data.dollName,
        dollPriceByn: data.dollPriceByn,
        customerName: data.customerName,
        customerPhone: normalizedPhone,
        customerContact: data.customerContact,
        contactChannel: data.contactChannel,
        deliveryType: data.deliveryType,
        deliveryCity: city,
        deliveryBranch: branch,
        paymentMethod: data.paymentMethod,
        comment: data.comment,
      });
    } catch (notifyErr) {
      console.error("Не критичная ошибка отправки уведомления в Telegram:", notifyErr);
    }

    // Инициализация онлайн-платежа (Фаза 6)
    let redirectUrl = `/zakaz/${res.publicToken}`;

    if (data.paymentMethod === "online_card") {
      try {
        const provider = getPaymentProvider();
        const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
        const cardRes = await provider.createCardPayment({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          amountByn: data.dollPriceByn,
          customerName: data.customerName,
          customerPhone: normalizedPhone,
          dollTitle: data.dollName,
          returnUrl: `${origin}/zakaz/${res.publicToken}`,
          notificationUrl: `${origin}/api/payments/webhook`,
        });

        if (cardRes.success && cardRes.redirectUrl) {
          redirectUrl = cardRes.redirectUrl;
        }
        if (cardRes.paymentId) {
          await db
            .update(orders)
            .set({ paymentId: cardRes.paymentId })
            .where(eq(orders.id, res.orderId));
        }
      } catch (payErr) {
        console.error("Ошибка при инициализации онлайн-оплаты картой:", payErr);
      }
    } else if (data.paymentMethod === "online_erip") {
      try {
        const provider = getPaymentProvider();
        const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
        const eripRes = await provider.createEripInvoice({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          amountByn: data.dollPriceByn,
          customerName: data.customerName,
          customerPhone: normalizedPhone,
          dollTitle: data.dollName,
          notificationUrl: `${origin}/api/payments/webhook`,
        });

        if (eripRes.paymentId) {
          await db
            .update(orders)
            .set({ paymentId: eripRes.paymentId })
            .where(eq(orders.id, res.orderId));
        }
      } catch (payErr) {
        console.error("Ошибка при инициализации счёта в ЕРИП:", payErr);
      }
    }

    return {
      success: true,
      orderNumber: res.orderNumber,
      publicToken: res.publicToken,
      redirectUrl,
    };
  } catch (err) {
    console.error("Ошибка при создании заказа:", err);
    return {
      success: false,
      code: "SERVER_ERROR",
      error: "Произошла непредвиденная ошибка при оформлении заказа.",
    };
  }
}

export interface PublicOrderSummary {
  orderNumber: number;
  publicToken: string;
  dollTitle: string;
  dollSlug: string;
  dollCoverUrl: string | null;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "completed";
  trackingNumber: string | null;
  paymentMethod: string;
  deliveryType: "postal" | "pickup";
  deliveryCity: string;
  createdAt: string;
}

export type FindOrdersResult =
  | {
      success: true;
      orders: PublicOrderSummary[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * Server Action поиска заказов покупателя по номеру телефона Беларуси.
 * Находит все заказы, привязанные к номеру, обновляет cookie и возвращает безопасные данные.
 */
export async function findOrdersByPhoneAction(
  rawPhone: string
): Promise<FindOrdersResult> {
  const normalized = normalizeBelarusPhone(rawPhone);
  if (!normalized) {
    return {
      success: false,
      error: "Пожалуйста, введите корректный номер телефона Беларуси (+375...)",
    };
  }

  try {
    const list = await getOrdersByCustomerPhone(normalized);

    // Сохраняем найденные токены в cookie
    if (list.length > 0) {
      try {
        const cookieStore = await cookies();
        const existingCookie = cookieStore.get("dollshop_order_tokens")?.value || "";
        const existingTokens = existingCookie ? existingCookie.split(",").filter(Boolean) : [];
        const newTokens = list.map((o) => o.publicToken);
        const combined = Array.from(new Set([...newTokens, ...existingTokens]));

        cookieStore.set("dollshop_order_tokens", combined.slice(0, 10).join(","), {
          httpOnly: false,
          sameSite: "lax",
          maxAge: 365 * 24 * 60 * 60,
          path: "/",
        });
      } catch {
        // Игнорируем вне Next.js
      }
    }

    const publicOrders: PublicOrderSummary[] = list.map((order) => {
      const isPickup =
        order.deliveryBranch.toLowerCase().includes("самовывоз") ||
        (order.deliveryCity.toLowerCase() === "минск" &&
          order.deliveryBranch.toLowerCase().includes("согласован"));

      return {
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        dollTitle: order.item?.productTitle || `Заказ #${order.orderNumber}`,
        dollSlug: order.item?.productSlug || "",
        dollCoverUrl: order.item?.coverUrl || null,
        totalAmount: order.totalAmount,
        status: order.status,
        trackingNumber: order.trackingNumber,
        paymentMethod: order.paymentMethod,
        deliveryType: isPickup ? "pickup" : "postal",
        deliveryCity: order.deliveryCity,
        createdAt: order.createdAt.toISOString(),
      };
    });

    return {
      success: true,
      orders: publicOrders,
    };
  } catch (err) {
    console.error("Ошибка поиска заказов по номеру:", err);
    return {
      success: false,
      error: "Не удалось выполнить поиск. Попробуйте еще раз позже.",
    };
  }
}

/**
 * Получение заказов текущего посетителя по cookie dollshop_order_tokens.
 */
export async function getMySavedOrdersAction(): Promise<PublicOrderSummary[]> {
  try {
    const cookieStore = await cookies();
    const rawTokens = cookieStore.get("dollshop_order_tokens")?.value || "";
    const tokens = rawTokens.split(",").map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) return [];

    const list = await getOrdersByPublicTokens(tokens);
    return list.map((order) => {
      const isPickup =
        order.deliveryBranch.toLowerCase().includes("самовывоз") ||
        (order.deliveryCity.toLowerCase() === "минск" &&
          order.deliveryBranch.toLowerCase().includes("согласован"));

      return {
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        dollTitle: order.item?.productTitle || `Заказ #${order.orderNumber}`,
        dollSlug: order.item?.productSlug || "",
        dollCoverUrl: order.item?.coverUrl || null,
        totalAmount: order.totalAmount,
        status: order.status,
        trackingNumber: order.trackingNumber,
        paymentMethod: order.paymentMethod,
        deliveryType: isPickup ? "pickup" : "postal",
        deliveryCity: order.deliveryCity,
        createdAt: order.createdAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}
