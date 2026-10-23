"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { createOrder } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  getReservationCookieName,
  hashReservationToken,
} from "@/lib/reservation/token";
import { isValidBelarusPhone, normalizeBelarusPhone } from "@/lib/utils/phone";
import { notifyNewOrder } from "@/lib/notify/telegram";
import { getPaymentProvider } from "@/lib/payments/bepaid";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const orderFormSchema = z
  .object({
    productId: z.string().uuid("Некорректный идентификатор товара"),
    slug: z.string().min(1, "Слаг куклы обязателен"),
    dollName: z.string().min(1, "Название куклы обязательно"),
    dollPriceByn: z.number().positive("Стоимость должна быть положительной"),

    customerName: z
      .string({ required_error: "Введите ваше имя и фамилию" })
      .trim()
      .min(3, "Укажите имя и фамилию (минимум 3 символа)")
      .max(120, "Слишком длинное имя"),

    customerPhone: z
      .string({ required_error: "Введите номер телефона" })
      .trim()
      .refine(isValidBelarusPhone, {
        message: "Введите корректный номер телефона Беларуси (+375...)",
      }),

    contactChannel: z.enum(["telegram", "viber", "call"], {
      required_error: "Выберите предпочтительный канал связи",
    }),

    customerContact: z.string().max(80).optional().nullable(),

    deliveryType: z.enum(["postal", "pickup"], {
      required_error: "Выберите способ получения (почта или самовывоз)",
    }),

    deliveryCity: z.string().max(100).optional(),
    deliveryBranch: z.string().max(200).optional(),

    paymentMethod: z.enum(
      ["erip_invoice", "bank_transfer", "cod", "online_card", "online_erip"],
      {
        required_error: "Выберите способ оплаты",
      }
    ),

    comment: z.string().max(500, "Комментарий слишком длинный").optional().nullable(),

    pdConsent: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласие на обработку персональных данных",
    }),

    offerConsent: z.boolean().refine((val) => val === true, {
      message: "Необходимо принять условия публичной оферты",
    }),

    honeypot: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === "postal") {
      if (!data.deliveryCity || data.deliveryCity.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите населённый пункт для отправки почтой",
          path: ["deliveryCity"],
        });
      }
      if (!data.deliveryBranch || data.deliveryBranch.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите номер почтового отделения (ОПС) или индекс",
          path: ["deliveryBranch"],
        });
      }
    }
  });

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

    // Сбрасываем кэш каталога
    try {
      revalidateTag(CACHE_TAGS.products, "max-age=0");
      revalidateTag(CACHE_TAGS.product(data.slug), "max-age=0");
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
