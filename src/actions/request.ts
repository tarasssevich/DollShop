"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { customRequests, products } from "@/db/schema";
import { isValidBelarusPhone, normalizeBelarusPhone } from "@/lib/utils/phone";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { notifyCustomRequest } from "@/lib/notify/telegram";

export const customRequestSchema = z.object({
  customerName: z
    .string({ required_error: "Введите ваше имя" })
    .trim()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Слишком длинное имя"),

  customerPhone: z
    .string({ required_error: "Введите номер телефона" })
    .trim()
    .refine(isValidBelarusPhone, {
      message: "Введите корректный номер телефона Беларуси (+375...)",
    }),

  contactChannel: z.enum(["telegram", "viber", "call"], {
    required_error: "Укажите удобный канал для связи",
  }),

  customerContact: z.string().max(80).optional().nullable(),
  referenceSlug: z.string().optional().nullable(),
  referenceProductId: z.string().uuid().optional().nullable(),

  wishes: z
    .string({ required_error: "Опишите ваши пожелания к образу куклы" })
    .trim()
    .min(5, "Пожалуйста, опишите пожелания чуть подробнее (от 5 символов)")
    .max(1000, "Текст слишком длинный (максимум 1000 символов)"),

  pdConsent: z.boolean().refine((val) => val === true, {
    message: "Необходимо согласие на обработку персональных данных",
  }),

  honeypot: z.string().optional(),
});

export type CustomRequestInput = z.infer<typeof customRequestSchema>;

export type CustomRequestResult =
  | { success: true; message: string; requestId?: string }
  | {
      success: false;
      code: "VALIDATION_ERROR" | "RATE_LIMITED" | "SERVER_ERROR";
      error: string;
      issues?: z.ZodIssue[];
    };

/**
 * Server Action отправки заявки на индивидуальный заказ «Хочу похожую» (Step 5.4).
 * Включает:
 * - Honeypot ловушку для ботов;
 * - In-memory rate-limiter (максимум 3 заявки за 10 минут с одного IP);
 * - Сохранение в таблицу custom_requests PostgreSQL;
 * - Мгновенное уведомление мастера в Telegram.
 */
export async function createCustomRequestAction(
  input: unknown
): Promise<CustomRequestResult> {
  const parsed = customRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message || "Пожалуйста, проверьте заполнение формы",
      issues: parsed.error.issues,
    };
  }

  const data = parsed.data;

  // 1. Honeypot ловушка для спам-ботов
  if (data.honeypot && data.honeypot.trim().length > 0) {
    return {
      success: true,
      message: "Ваша заявка успешно отправлена мастеру!",
    };
  }

  // 2. Rate-limiter (3 заявки за 10 минут)
  let clientIp = "127.0.0.1";
  try {
    const reqHeaders = await headers();
    clientIp =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      reqHeaders.get("x-real-ip") ||
      "127.0.0.1";
  } catch {
    // В тестах или SSR без headers
  }

  const rateCheck = checkRateLimit(`custom_request:${clientIp}`, 3, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error:
        "Вы отправили несколько заявок подряд. Пожалуйста, подождите несколько минут перед следующей отправкой.",
    };
  }

  const normalizedPhone = normalizeBelarusPhone(data.customerPhone);
  if (!normalizedPhone) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Номер телефона должен быть в формате Беларуси (+375...)",
    };
  }

  // 3. Определение референсной куклы
  let resolvedProductId = data.referenceProductId || null;
  let referenceDollName: string | null = null;

  try {
    if (data.referenceSlug) {
      const [refProd] = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .where(eq(products.slug, data.referenceSlug));

      if (refProd) {
        resolvedProductId = refProd.id;
        referenceDollName = refProd.title;
      }
    } else if (resolvedProductId) {
      const [refProd] = await db
        .select({ title: products.title })
        .from(products)
        .where(eq(products.id, resolvedProductId));

      if (refProd) {
        referenceDollName = refProd.title;
      }
    }

    // 4. Сохранение заявки в PostgreSQL
    const [created] = await db
      .insert(customRequests)
      .values({
        customerName: data.customerName,
        customerPhone: normalizedPhone,
        customerContact: data.customerContact?.trim() || null,
        contactChannel: data.contactChannel,
        referenceProductId: resolvedProductId,
        wishes: data.wishes,
        status: "new",
        pdConsentAt: new Date(),
      })
      .returning({ id: customRequests.id });

    if (!created) {
      return {
        success: false,
        code: "SERVER_ERROR",
        error: "Не удалось сохранить заявку. Попробуйте еще раз.",
      };
    }

    // 5. Уведомление мастера в Telegram (Step 5.3)
    try {
      await notifyCustomRequest({
        requestId: created.id,
        customerName: data.customerName,
        customerPhone: normalizedPhone,
        customerContact: data.customerContact,
        contactChannel: data.contactChannel,
        referenceDollName,
        comment: data.wishes,
      });
    } catch (tgErr) {
      console.error("Ошибка отправки заявки в Telegram:", tgErr);
    }

    return {
      success: true,
      requestId: created.id,
      message:
        "Ваша заявка успешно отправлена мастеру! Алёна свяжется с вами в течение нескольких часов для согласования деталей.",
    };
  } catch (err) {
    console.error("Ошибка при создании заявки на куклу:", err);
    return {
      success: false,
      code: "SERVER_ERROR",
      error: "Произошла непредвиденная ошибка. Пожалуйста, повторите попытку.",
    };
  }
}
