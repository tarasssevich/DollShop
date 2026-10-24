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
 * Получение списка разрешенных Chat ID из переменной TELEGRAM_CHAT_ID.
 * Поддерживает как одиночный ID ("1154656833"), так и список через запятую ("1154656833, 987654321").
 */
export function getAuthorizedTelegramChatIds(): string[] {
  const raw = process.env.TELEGRAM_CHAT_ID || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Проверка, авторизован ли указанный Chat ID для получения уведомлений и выполнения действий.
 */
export function isAuthorizedTelegramChat(
  chatId: string | number | undefined | null
): boolean {
  if (!chatId) return false;
  const authorized = getAuthorizedTelegramChatIds();
  return authorized.includes(String(chatId));
}

/**
 * Базовый клиент отправки сообщений в Telegram Bot API.
 * Поддерживает рассылку нескольким авторизованным администраторам / мастерам.
 * Если токен или chat_id не настроены, работает в безопасном режиме отладки (dev fallback).
 */
export async function sendTelegramMessage(options: {
  text: string;
  replyMarkup?: unknown;
}): Promise<SendTelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getAuthorizedTelegramChatIds();

  if (!token || chatIds.length === 0) {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        "📱 [Telegram Dev Fallback] Токен бота или chat_id не заданы. Сообщение мастеру:\n" +
          options.text
      );
    }
    return { success: true, simulated: true };
  }

  let lastMessageId: number | undefined;
  let hasSuccess = false;
  let lastError: string | undefined;

  // Рассылаем уведомление каждому авторизованному получателю в белом списке
  for (const chatId of chatIds) {
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

      if (response.ok) {
        const data = (await response.json()) as {
          ok: boolean;
          result?: { message_id: number };
        };
        lastMessageId = data.result?.message_id;
        hasSuccess = true;
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = `Telegram API Error (${response.status}): ${JSON.stringify(errJson)}`;
        console.error(`Telegram ошибка для chat_id ${chatId}:`, lastError);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`Ошибка при отправке в Telegram для chat_id ${chatId}:`, lastError);
    }
  }

  if (!hasSuccess && lastError) {
    return { success: false, error: lastError };
  }

  return { success: true, messageId: lastMessageId };
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
  const chatIds = getAuthorizedTelegramChatIds();

  if (!token || chatIds.length === 0) {
    if (process.env.NODE_ENV !== "test") {
      console.log(`📱 [Telegram Dev Fallback] Фото ${options.filename || ""}: ${options.caption || ""}`);
    }
    return { success: true, simulated: true };
  }

  let lastMessageId: number | undefined;
  let hasSuccess = false;
  let lastError: string | undefined;

  for (const chatId of chatIds) {
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

      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
        lastMessageId = data.result?.message_id;
        hasSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = `Telegram sendPhoto Error (${res.status}): ${JSON.stringify(errJson)}`;
        console.error(`Telegram фото ошибка для chat_id ${chatId}:`, lastError);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`Ошибка при отправке фото в Telegram для chat_id ${chatId}:`, lastError);
    }
  }

  if (!hasSuccess && lastError) {
    return { success: false, error: lastError };
  }

  return { success: true, messageId: lastMessageId };
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
