import {
  formatNewOrderMessage,
  formatCustomRequestMessage,
  buildOrderInlineKeyboard,
  buildCustomRequestInlineKeyboard,
  type NewOrderNotificationParams,
  type CustomRequestNotificationParams,
} from "./templates";

export interface SendTelegramResult {
  success: boolean;
  messageId?: number;
  simulated?: boolean;
  error?: string;
}

/**
 * Базовый клиент отправки сообщений в Telegram Bot API.
 * Если токен или chat_id не настроены, работает в безопасном режиме отладки (dev fallback).
 */
export async function sendTelegramMessage(options: {
  text: string;
  replyMarkup?: unknown;
}): Promise<SendTelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token.trim() === "" || chatId.trim() === "") {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        "📱 [Telegram Dev Fallback] Токен бота не задан. Сообщение мастеру:\n" +
          options.text
      );
    }
    return { success: true, simulated: true };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: options.text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    if (options.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = `Telegram API Error (${response.status}): ${JSON.stringify(errJson)}`;
      console.error(errMsg);
      return { success: false, error: errMsg };
    }

    const data = (await response.json()) as { ok: boolean; result?: { message_id: number } };
    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err) {
    const errorString = err instanceof Error ? err.message : String(err);
    console.error("Ошибка при отправке в Telegram:", errorString);
    return { success: false, error: errorString };
  }
}

/**
 * Отправка структурированного уведомления о новом заказе куклы с интерактивными кнопками управления.
 */
export async function notifyNewOrder(
  params: NewOrderNotificationParams
): Promise<SendTelegramResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
  const text = formatNewOrderMessage(params);
  const replyMarkup = buildOrderInlineKeyboard(params.orderId, appUrl);

  return sendTelegramMessage({
    text,
    replyMarkup,
  });
}

/**
 * Отправка структурированного уведомления о новой заявке «Хочу похожую».
 */
export async function notifyCustomRequest(
  params: CustomRequestNotificationParams
): Promise<SendTelegramResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
  const text = formatCustomRequestMessage(params);
  const replyMarkup = buildCustomRequestInlineKeyboard(appUrl);

  return sendTelegramMessage({
    text,
    replyMarkup,
  });
}
