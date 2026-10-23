import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders, orderItems, products } from "@/db/schema";
import { setOrderStatus } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPaymentProvider } from "@/lib/payments/bepaid";
import { sendTelegramMessage } from "@/lib/notify/telegram";
import { formatPrice } from "@/lib/utils/format";

export const runtime = "nodejs";

/**
 * Вебхук обработки платежей от платежного шлюза (bePaid / ERIP) — Step 6.4.
 * Гарантирует:
 * 1. Проверку подписи запроса.
 * 2. Идемпотентность (повторный вебхук не дублирует действия).
 * 3. Атомарный перевод заказа в статус 'paid' и куклы в 'sold'.
 * 4. Инвалидацию кэша каталога.
 * 5. Уведомление мастера в Telegram.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const provider = getPaymentProvider();

    const verification = await provider.verifyWebhook(req.headers, rawBody);

    if (!verification.valid) {
      console.warn("Отклонен невалидный вебхук платежа:", verification.error);
      return NextResponse.json(
        { error: verification.error || "Недействительная подпись" },
        { status: 401 }
      );
    }

    const { orderId, paymentId, status, amountByn, paymentMethod } = verification;

    if (!orderId) {
      console.warn("В вебхуке платежа отсутствует orderId");
      return NextResponse.json(
        { error: "Идентификатор заказа отсутствует в запросе" },
        { status: 400 }
      );
    }

    // Проверяем наличие заказа в базе данных
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      console.warn(`Заказ ${orderId} из вебхука не найден в базе данных`);
      return NextResponse.json(
        { error: "Заказ не найден" },
        { status: 404 }
      );
    }

    // Идемпотентность: если заказ уже оплачен или выполнен, возвращаем успешный ответ без повторных действий
    if (order.status === "paid" || order.status === "completed") {
      return NextResponse.json({
        ok: true,
        message: "Заказ уже имеет подтвержденную оплату (идемпотентно)",
      });
    }

    if (status === "successful") {
      // 1. Атомарно переводим статус заказа в 'paid', а куклу в 'sold'
      const statusRes = await setOrderStatus(orderId, "paid");

      if (statusRes.errorCode) {
        console.error(`Ошибка смены статуса заказа ${orderId}:`, statusRes.errorCode);
        return NextResponse.json(
          { error: `Ошибка обновления статуса: ${statusRes.errorCode}` },
          { status: 409 }
        );
      }

      // 2. Сохраняем paymentId в заказ, если он был передан
      if (paymentId && order.paymentId !== paymentId) {
        await db
          .update(orders)
          .set({ paymentId })
          .where(eq(orders.id, orderId));
      }

      // 3. Инвалидация кэша каталога
      try {
        revalidateTag(CACHE_TAGS.products, { expire: 0 });
        if (statusRes.productSlug) {
          revalidateTag(CACHE_TAGS.product(statusRes.productSlug), { expire: 0 });
        }
      } catch {
        // Игнорируем вне Next.js контекста
      }

      // 4. Уведомление мастера в Telegram
      try {
        const payMethodLabel =
          paymentMethod === "card"
            ? "💳 Банковская карта онлайн"
            : "📱 ЕРИП (АИС «Расчет»)";

        const [item] = await db
          .select({
            productTitle: products.title,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderId));

        const dollName = item?.productTitle || `Заказ #${order.orderNumber}`;
        const paidAmount = amountByn ? formatPrice(amountByn) : formatPrice(Number(order.totalAmount));

        await sendTelegramMessage({
          text:
            `💰 <b>ОПЛАТА ЗАКАЗА ПОЛУЧЕНА!</b>\n\n` +
            `🎉 <b>Заказ #${order.orderNumber}</b> на куклу «${dollName}» успешно оплачен!\n` +
            `Способ оплаты: <b>${payMethodLabel}</b>\n` +
            `Сумма: <b>${paidAmount}</b>\n` +
            (paymentId ? `ID транзакции: <code>${paymentId}</code>\n` : "") +
            `Кукла автоматически переведена в Архив витрины.`,
        });
      } catch (tgErr) {
        console.error("Не критичная ошибка Telegram уведомления из вебхука:", tgErr);
      }

      return NextResponse.json({
        ok: true,
        status: "paid",
        orderNumber: order.orderNumber,
      });
    }

    // Если статус платежа неуспешный или истек
    if (status === "expired" || status === "failed") {
      console.info(`Вебхук: платёж для заказа #${order.orderNumber} имеет статус "${status}"`);
      return NextResponse.json({
        ok: true,
        status,
        message: `Платеж зафиксирован со статусом ${status}`,
      });
    }

    return NextResponse.json({ ok: true, status: "ignored" });
  } catch (err) {
    console.error("Критическая ошибка обработки платежного вебхука:", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при обработке вебхука" },
      { status: 500 }
    );
  }
}
