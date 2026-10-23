import fs from "node:fs/promises";
import path from "node:path";
import {
  formatNewOrderMessage,
  formatCustomRequestMessage,
  buildOrderInlineKeyboard,
  buildCustomRequestInlineKeyboard,
  escapeHtml,
  type NewOrderNotificationParams,
  type CustomRequestNotificationParams,
} from "./templates";
import { findUploadedFileLocally } from "@/lib/storage/local-fs";

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
 * Отправляет локальный файл изображения в Telegram (multipart/form-data).
 */
export async function sendTelegramPhoto(options: {
  buffer: Buffer;
  caption?: string;
  filename?: string;
}): Promise<SendTelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token.trim() === "" || chatId.trim() === "") {
    if (process.env.NODE_ENV !== "test") {
      console.log(`📱 [Telegram Dev Fallback] Фото ${options.filename || ""}: ${options.caption || ""}`);
    }
    return { success: true, simulated: true };
  }

  try {
    const fd = new FormData();
    fd.append("chat_id", chatId);
    const blob = new Blob([new Uint8Array(options.buffer)]);
    fd.append("photo", blob, options.filename || "reference.jpg");
    if (options.caption) {
      fd.append("caption", options.caption);
      fd.append("parse_mode", "HTML");
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error(`Telegram sendPhoto Error (${res.status}):`, errJson);
      return { success: false, error: JSON.stringify(errJson) };
    }

    const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err) {
    const errorString = err instanceof Error ? err.message : String(err);
    console.error("Ошибка при отправке фото в Telegram:", errorString);
    return { success: false, error: errorString };
  }
}

/**
 * Отправка структурированного уведомления о новой заявке «Хочу похожую» с отправкой прикрепленных референсов.
 */
export async function notifyCustomRequest(
  params: CustomRequestNotificationParams
): Promise<SendTelegramResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
  const text = formatCustomRequestMessage(params);
  const replyMarkup = buildCustomRequestInlineKeyboard(appUrl);

  const mainResult = await sendTelegramMessage({
    text,
    replyMarkup,
  });

  // Если к заявке прикреплены фото-референсы, отправляем их мастеру в Telegram
  if (params.referencePhotoUrls && params.referencePhotoUrls.length > 0) {
    for (let i = 0; i < params.referencePhotoUrls.length; i++) {
      const url = params.referencePhotoUrls[i]!;
      try {
        const cleanSubpath = url.replace(/^\/uploads\//, "");
        const filePath = await findUploadedFileLocally(cleanSubpath);
        if (filePath) {
          const buf = await fs.readFile(filePath);
          await sendTelegramPhoto({
            buffer: buf,
            caption: `📸 <b>Референс к заявке от ${escapeHtml(params.customerName)}</b> (${i + 1}/${params.referencePhotoUrls.length})`,
            filename: path.basename(filePath),
          });
        }
      } catch (photoErr) {
        console.error("Не удалось отправить фото-референс в Telegram:", photoErr);
      }
    }
  }

  return mainResult;
}
