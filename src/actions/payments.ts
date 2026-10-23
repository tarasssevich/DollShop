"use server";

import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import { setOrderStatus } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { sendTelegramMessage } from "@/lib/notify/telegram";
import { formatPrice } from "@/lib/utils/format";

const simulateCardSchema = z.object({
  orderId: z.string().uuid("Некорректный идентификатор заказа"),
  orderNumber: z.number().int(),
  amountByn: z.number().positive(),
  dollTitle: z.string().min(1),
  outcome: z.enum(["success", "declined", "cancelled"]),
});

/**
 * Серверный экшн эмулятора онлайн-оплаты в Sandbox режиме (Фаза 6).
 * Позволяет тестировать сценарии успешной оплаты, отказа банка и отмены прямо в браузере или со смартфона.
 */
export async function simulateSandboxCardPaymentAction(
  input: z.infer<typeof simulateCardSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = simulateCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры платежа" };
  }

  const { orderId, orderNumber, amountByn, dollTitle, outcome } = parsed.data;

  if (outcome === "declined") {
    return {
      success: false,
      error: "Оплата отклонена банком: недостаточно средств на карте или отказ 3-D Secure.",
    };
  }

  if (outcome === "cancelled") {
    return {
      success: false,
      error: "Оплата отменена пользователем.",
    };
  }

  try {
    // 1. Атомарный перевод заказа в статус 'paid' (кукла становится 'sold')
    const res = await setOrderStatus(orderId, "paid");

    if (res.errorCode) {
      return { success: false, error: `Ошибка смены статуса заказа: ${res.errorCode}` };
    }

    // 2. Инвалидация кэша каталога и страниц магазина и админки
    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      if (res.productSlug) {
        revalidateTag(CACHE_TAGS.product(res.productSlug), { expire: 0 });
        revalidatePath(`/kukly/${res.productSlug}`, "page");
      }
      revalidatePath("/", "page");
      revalidatePath("/kukly", "page");
      revalidatePath("/cart", "page");
      revalidatePath("/admin/zakazy", "page");
      revalidatePath("/admin/kukly", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    // 3. Отправка радостного Telegram-уведомления мастеру об успешной онлайн-оплате
    try {
      await sendTelegramMessage({
        text:
          `💰 <b>ОПЛАТА ОНЛАЙН КАРТОЙ ПОЛУЧЕНА!</b>\n\n` +
          `🎉 <b>Заказ #${orderNumber}</b> на куклу «${dollTitle}» успешно оплачен!\n` +
          `Сумма: <b>${formatPrice(amountByn)}</b>\n` +
          `Статус куклы: 🏡 <b>«Нашла дом» (переведена в Архив)</b>.`,
      });
    } catch (tgErr) {
      console.error("Ошибка Telegram уведомления об оплате:", tgErr);
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка при симуляции оплаты картой:", err);
    return { success: false, error: "Непредвиденный сбой при фиксации оплаты" };
  }
}

const simulateEripSchema = z.object({
  orderId: z.string().uuid("Некорректный идентификатор заказа"),
  orderNumber: z.number().int(),
  amountByn: z.number().positive(),
  dollTitle: z.string().min(1),
});

/**
 * Серверный экшн симуляции оплаты через ЕРИП в демо/тестовом режиме (Step 6.3).
 */
export async function simulateSandboxEripPaymentAction(
  input: z.infer<typeof simulateEripSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = simulateEripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры ЕРИП" };
  }

  const { orderId, orderNumber, amountByn, dollTitle } = parsed.data;

  try {
    const res = await setOrderStatus(orderId, "paid");

    if (res.errorCode) {
      return { success: false, error: `Ошибка фиксации платежа: ${res.errorCode}` };
    }

    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      if (res.productSlug) {
        revalidateTag(CACHE_TAGS.product(res.productSlug), { expire: 0 });
      }
    } catch {
      // Игнорируем вне Next.js
    }

    try {
      await sendTelegramMessage({
        text:
          `📱 <b>ОПЛАТА ЧЕРЕЗ ЕРИП ПОЛУЧЕНА!</b>\n\n` +
          `✅ <b>Заказ #${orderNumber}</b> на куклу «${dollTitle}» оплачен в ЕРИП!\n` +
          `Сумма: <b>${formatPrice(amountByn)}</b>\n` +
          `Кукла автоматически переведена в Архив витрины.`,
      });
    } catch (tgErr) {
      console.error("Ошибка Telegram уведомления об оплате ЕРИП:", tgErr);
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка симуляции платежа ЕРИП:", err);
    return { success: false, error: "Не удалось подтвердить платёж ЕРИП" };
  }
}
