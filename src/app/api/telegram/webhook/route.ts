import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { setOrderStatus } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { escapeHtml } from "@/lib/notify/templates";

function verifyWebhookSecretTimingSafe(provided: string | null, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedHash = crypto.createHash("sha256").update(provided).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name?: string;
    username?: string;
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
    };
    text?: string;
  };
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  callback_query?: TelegramCallbackQuery;
}

async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch (err) {
    console.error("Не удалось ответить на callback_query в Telegram:", err);
  }
}

async function editTelegramMessageText(
  token: string,
  chatId: number,
  messageId: number,
  newText: string,
  appUrl: string
): Promise<void> {
  try {
    const validUrl = appUrl.includes("localhost")
      ? "https://dollshop.by"
      : appUrl;

    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔗 Открыть заказ в админке",
                url: `${validUrl}/admin/zakazy`,
              },
            ],
          ],
        },
      }),
    });
  } catch (err) {
    console.error("Не удалось обновить сообщение в Telegram:", err);
  }
}

/**
 * Вебхук для обработки интерактивных кнопок Telegram бота (Step 5.3).
 * Позволяет мастеру одним кликом из уведомления в Telegram:
 * - подтвердить оплату заказа (кукла переходит в архив / статус sold);
 * - отменить заказ (бронь снимается, кукла моментально возвращается на витрину в статус available).
 */
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";

  // Проверка секретного токена вебхука с защитой от Timing Attack (если настроен)
  if (webhookSecret) {
    const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (!verifyWebhookSecretTimingSafe(receivedSecret, webhookSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Обработка клика по Inline-кнопке (callback_query)
  const cb = update.callback_query;
  if (cb && cb.data) {
    const fromChatId = cb.message?.chat.id;
    const fromUserId = cb.from?.id;

    // Защита: действия разрешены только из чата мастера (проверяем chat.id и user.id)
    const isAuthorized =
      !authorizedChatId ||
      String(fromChatId) === String(authorizedChatId) ||
      String(fromUserId) === String(authorizedChatId);

    if (!isAuthorized) {
      if (token) {
        await answerCallbackQuery(token, cb.id, "Доступ запрещен: действие разрешено только мастеру");
      }
      return NextResponse.json({ ok: true, ignored: "unauthorized_chat" });
    }

    const [action, orderId] = cb.data.split(":");

    if (action === "confirm_order" && orderId) {
      // Подтверждение оплаты: кукла переходит в статус 'sold'
      const res = await setOrderStatus(orderId, "paid");

      if (token) {
        if (res.errorCode) {
          await answerCallbackQuery(token, cb.id, `Ошибка: ${res.errorCode}`);
        } else {
          await answerCallbackQuery(token, cb.id, "✅ Продажа подтверждена! Кукла переведена в архив.");

          // Сбрасываем кэш каталога
          try {
            revalidateTag(CACHE_TAGS.products, { expire: 0 });
            if (res.productSlug) {
              revalidateTag(CACHE_TAGS.product(res.productSlug), { expire: 0 });
            }
          } catch {
            // Игнорируем вне Next.js
          }

          if (cb.message?.text && fromChatId) {
            const updatedText =
              escapeHtml(cb.message.text) +
              "\n\n✅ <b>ПОДТВЕРЖДЕНО МАСТЕРОМ:</b> Заказ оплачен, кукла переведена в архив (Галерею).";
            await editTelegramMessageText(token, fromChatId, cb.message.message_id, updatedText, appUrl);
          }
        }
      }

      return NextResponse.json({ ok: true, action: "confirmed", orderId });
    }

    if (action === "cancel_order" && orderId) {
      // Отмена заказа: кукла возвращается в статус 'available'
      const res = await setOrderStatus(orderId, "cancelled");

      if (token) {
        if (res.errorCode) {
          await answerCallbackQuery(token, cb.id, `Ошибка: ${res.errorCode}`);
        } else {
          await answerCallbackQuery(token, cb.id, "❌ Заказ отменен. Кукла снова доступна на витрине.");

          try {
            revalidateTag(CACHE_TAGS.products, { expire: 0 });
            if (res.productSlug) {
              revalidateTag(CACHE_TAGS.product(res.productSlug), { expire: 0 });
            }
          } catch {
            // Игнорируем вне Next.js
          }

          if (cb.message?.text && fromChatId) {
            const updatedText =
              escapeHtml(cb.message.text) +
              "\n\n❌ <b>ЗАКАЗ ОТМЕНЕН:</b> Бронь снята, кукла снова доступна для покупки в каталоге.";
            await editTelegramMessageText(token, fromChatId, cb.message.message_id, updatedText, appUrl);
          }
        }
      }

      return NextResponse.json({ ok: true, action: "cancelled", orderId });
    }
  }

  // Ответ на стандартные команды (например /start)
  if (update.message?.text === "/start" && token && update.message.chat.id) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: update.message.chat.id,
        text: `✨ <b>Бот уведомлений DollShop подключен!</b>\n\nВаш Chat ID: <code>${update.message.chat.id}</code>\nДобавьте его в файл <code>.env.local</code> в переменную <code>TELEGRAM_CHAT_ID</code>.`,
        parse_mode: "HTML",
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
