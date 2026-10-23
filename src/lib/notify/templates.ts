import { formatPrice } from "@/lib/utils/format";
import { formatBelarusPhone } from "@/lib/utils/phone";

export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface NewOrderNotificationParams {
  orderNumber: number;
  orderId: string;
  dollName: string;
  dollPriceByn: number;
  customerName: string;
  customerPhone: string;
  customerContact?: string | null;
  contactChannel: "telegram" | "viber" | "call";
  deliveryType: "postal" | "pickup";
  deliveryCity: string;
  deliveryBranch: string;
  paymentMethod: "erip_invoice" | "bank_transfer" | "cod" | "online_card" | "online_erip";
  comment?: string | null;
}

export interface CustomRequestNotificationParams {
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerContact?: string | null;
  contactChannel: "telegram" | "viber" | "call";
  referenceDollName?: string | null;
  comment?: string | null;
  referencePhotoUrls?: string[];
}

export function formatPaymentMethodName(method: string): string {
  switch (method) {
    case "cod":
      return "📦 Наложенный платёж (оплата при получении на почте)";
    case "erip_invoice":
      return "💳 ЕРИП (счет для оплаты)";
    case "bank_transfer":
      return "🏦 Банковский перевод / карта";
    case "online_card":
      return "💳 Оплата картой онлайн";
    case "online_erip":
      return "📱 Онлайн ЕРИП";
    default:
      return method;
  }
}

export function formatChannelName(channel: string): string {
  switch (channel) {
    case "telegram":
      return "Telegram";
    case "viber":
      return "Viber";
    case "call":
      return "Телефонный звонок";
    default:
      return channel;
  }
}

/**
 * Формирование HTML-сообщения нового заказа для мастера в Telegram.
 */
export function formatNewOrderMessage(params: NewOrderNotificationParams): string {
  const safeDoll = escapeHtml(params.dollName);
  const safeName = escapeHtml(params.customerName);
  const safePhone = escapeHtml(formatBelarusPhone(params.customerPhone));
  const cleanDigits = params.customerPhone.replace(/\D/g, "");

  let channelInfo = formatChannelName(params.contactChannel);
  if (params.customerContact && params.customerContact.trim()) {
    const safeContact = escapeHtml(params.customerContact.trim());
    if (params.contactChannel === "telegram") {
      const handle = safeContact.replace(/^@/, "");
      channelInfo += ` (<a href="https://t.me/${handle}">@${handle}</a>)`;
    } else {
      channelInfo += ` (${safeContact})`;
    }
  }

  const deliveryText =
    params.deliveryType === "pickup"
      ? "📍 <b>Самовывоз в Минске</b> (бесплатно по согласованию)"
      : `📮 <b>Почта по Беларуси:</b> ${escapeHtml(params.deliveryCity)}, ${escapeHtml(params.deliveryBranch)}`;

  const paymentText = formatPaymentMethodName(params.paymentMethod);

  let message = `🎀 <b>НОВЫЙ ЗАКАЗ #${params.orderNumber}</b>\n\n`;
  message += `🧚 <b>Кукла:</b> «${safeDoll}»\n`;
  message += `💰 <b>Сумма:</b> ${formatPrice(params.dollPriceByn)}\n\n`;
  message += `👤 <b>Покупатель:</b> ${safeName}\n`;
  message += `📞 <b>Телефон:</b> <a href="tel:+${cleanDigits}">${safePhone}</a>\n`;
  message += `💬 <b>Связь:</b> ${channelInfo}\n\n`;
  message += `${deliveryText}\n`;
  message += `💳 <b>Оплата:</b> ${paymentText}\n`;

  if (params.comment && params.comment.trim()) {
    message += `\n📝 <b>Пожелание покупателя:</b>\n<i>«${escapeHtml(params.comment.trim())}»</i>\n`;
  }

  message += `\n⏳ <i>Кукла зафиксирована в брони. Согласуйте детали с покупателем. Управление заказом доступно в панели сайта.</i>`;

  return message;
}

/**
 * Инлайн-кнопка для быстрого перехода мастера в панель управления заказом на сайте.
 */
export function buildOrderInlineKeyboard(orderId: string, appUrl: string) {
  // Telegram Bot API требует валидный публичный URL для кнопок (отклоняет localhost)
  const validUrl = appUrl.includes("localhost") || appUrl.includes("127.0.0.1")
    ? (process.env.APP_PUBLIC_URL || "https://dollshop.by")
    : appUrl;

  return {
    inline_keyboard: [
      [
        {
          text: "🔗 Открыть заказ в админке",
          url: `${validUrl}/admin/zakazy`,
        },
      ],
    ],
  };
}

/**
 * Инлайн-кнопка для быстрого перехода мастера в панель управления заявками «Хочу похожую».
 */
export function buildCustomRequestInlineKeyboard(appUrl: string) {
  const validUrl = appUrl.includes("localhost") || appUrl.includes("127.0.0.1")
    ? (process.env.APP_PUBLIC_URL || "https://dollshop.by")
    : appUrl;

  return {
    inline_keyboard: [
      [
        {
          text: "🔗 Открыть заявки в админке",
          url: `${validUrl}/admin/zayavki`,
        },
      ],
    ],
  };
}

/**
 * Формирование HTML-сообщения заявки «Хочу похожую» для мастера в Telegram.
 */
export function formatCustomRequestMessage(
  params: CustomRequestNotificationParams
): string {
  const safeName = escapeHtml(params.customerName);
  const safePhone = escapeHtml(formatBelarusPhone(params.customerPhone));
  const cleanDigits = params.customerPhone.replace(/\D/g, "");

  let channelInfo = formatChannelName(params.contactChannel);
  if (params.customerContact && params.customerContact.trim()) {
    const safeContact = escapeHtml(params.customerContact.trim());
    if (params.contactChannel === "telegram") {
      const handle = safeContact.replace(/^@/, "");
      channelInfo += ` (<a href="https://t.me/${handle}">@${handle}</a>)`;
    } else {
      channelInfo += ` (${safeContact})`;
    }
  }

  let message = `💌 <b>НОВАЯ ЗАЯВКА «ХОЧУ ПОХОЖУЮ»</b>\n\n`;
  if (params.referenceDollName) {
    message += `🧚 <b>Референс куклы:</b> «${escapeHtml(params.referenceDollName)}»\n`;
  }
  message += `👤 <b>Имя клиента:</b> ${safeName}\n`;
  message += `📞 <b>Телефон:</b> <a href="tel:+${cleanDigits}">${safePhone}</a>\n`;
  message += `💬 <b>Удобный канал:</b> ${channelInfo}\n`;

  if (params.comment && params.comment.trim()) {
    message += `\n📝 <b>Пожелания к образу:</b>\n<i>«${escapeHtml(params.comment.trim())}»</i>\n`;
  }

  if (params.referencePhotoUrls && params.referencePhotoUrls.length > 0) {
    message += `\n📸 <b>Фото-референсы:</b> прикреплено ${params.referencePhotoUrls.length} шт. (см. ниже)`;
  }

  message += `\n\n📋 <i>Управление заявкой доступно в панели сайта.</i>`;

  return message;
}

/**
 * Формирование теплого текста уведомления покупателя о готовности куклы по индивидуальному заказу.
 */
export function buildCustomOrderNotificationText(params: {
  customerName: string;
  dollTitle: string;
  priceByn: number;
  slug: string;
  appUrl?: string;
}): string {
  const firstName = params.customerName.split(" ")[0] || params.customerName;
  const baseUrl = params.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
  const link = `${baseUrl}/kukly/${params.slug}`;

  return `Здравствуйте, ${firstName}! ✨ Ваша куколка «${params.dollTitle}» по индивидуальной заявке готова!\n\nСтоимость: ${params.priceByn.toFixed(2)} BYN.\nПосмотреть фотографии куклы и оформить получение можно по ссылке:\n${link}\n\nБуду рада бережно отправить её вам почтой по Беларуси или передать при встрече в Минске!`;
}
