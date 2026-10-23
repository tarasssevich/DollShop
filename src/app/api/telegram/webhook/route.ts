import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { setOrderStatus } from "@/db/functions";
import { CACHE_TAGS } from "@/lib/cache/tags";

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
  newText: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
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

  // Проверка секретного токена вебхука, если он настроен
  if (webhookSecret) {
    const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== webhookSecret) {
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

    // Защита: действия разрешены только из чата мастера
    if (authorizedChatId && String(fromChatId) !== String(authorizedChatId)) {
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
            revalidateTag(CACHE_TAGS.products, "max-age=0");
            if (res.productSlug) {
              revalidateTag(CACHE_TAGS.product(res.productSlug), "max-age=0");
            }
          } catch {
            // Игнорируем вне Next.js
          }

          if (cb.message?.text && fromChatId) {
            const updatedText =
              cb.message.text +
              "\n\n✅ <b>ПОДТВЕРЖДЕНО МАСТЕРОМ:</b> Заказ оплачен, кукла переведена в архив (Галерею).";
            await editTelegramMessageText(token, fromChatId, cb.message.message_id, updatedText);
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
            revalidateTag(CACHE_TAGS.products, "max-age=0");
            if (res.productSlug) {
              revalidateTag(CACHE_TAGS.product(res.productSlug), "max-age=0");
            }
          } catch {
            // Игнорируем вне Next.js
          }

          if (cb.message?.text && fromChatId) {
            const updatedText =
              cb.message.text +
              "\n\n❌ <b>ЗАКАЗ ОТМЕНЕН:</b> Бронь снята, кукла снова доступна для покупки в каталоге.";
            await editTelegramMessageText(token, fromChatId, cb.message.message_id, updatedText);
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
