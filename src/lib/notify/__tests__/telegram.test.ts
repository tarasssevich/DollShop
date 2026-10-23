import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeHtml,
  formatNewOrderMessage,
  formatCustomRequestMessage,
  buildOrderInlineKeyboard,
} from "../templates";
import { sendTelegramMessage, notifyNewOrder } from "../telegram";

describe("Step 5.3 — Telegram Templates & Notification Client", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("escapeHtml", () => {
    it("экранирует спецсимволы HTML для защиты от инъекций", () => {
      const raw = '<b>"Фея" & <Гном></b>';
      const escaped = escapeHtml(raw);
      expect(escaped).toBe("&lt;b&gt;&quot;Фея&quot; &amp; &lt;Гном&gt;&lt;/b&gt;");
    });
  });

  describe("formatNewOrderMessage", () => {
    it("формирует читаемое HTML-сообщение заказа с отправкой почтой и наложенным платежом", () => {
      const msg = formatNewOrderMessage({
        orderNumber: 1042,
        orderId: "00000000-0000-0000-0000-000000000001",
        dollName: "Селеста · Фея незабудок",
        dollPriceByn: 75,
        customerName: "Ольга Смирнова",
        customerPhone: "+375291234567",
        contactChannel: "telegram",
        customerContact: "@olga_sm",
        deliveryType: "postal",
        deliveryCity: "Витебск",
        deliveryBranch: "ОПС 210001",
        paymentMethod: "cod",
        comment: "Подарок для дочки",
      });

      expect(msg).toContain("НОВЫЙ ЗАКАЗ #1042");
      expect(msg).toContain("Селеста · Фея незабудок");
      expect(msg).toContain("75 BYN");
      expect(msg).toContain("Ольга Смирнова");
      expect(msg).toContain("+375 (29) 123-45-67");
      expect(msg).toContain("https://t.me/olga_sm");
      expect(msg).toContain("Почта по Беларуси");
      expect(msg).toContain("Витебск");
      expect(msg).toContain("Наложенный платёж");
      expect(msg).toContain("Подарок для дочки");
    });

    it("формирует корректное сообщение при самовывозе в Минске", () => {
      const msg = formatNewOrderMessage({
        orderNumber: 1043,
        orderId: "00000000-0000-0000-0000-000000000002",
        dollName: "Мирабель",
        dollPriceByn: 90,
        customerName: "Иван Петров",
        customerPhone: "+375447778899",
        contactChannel: "call",
        deliveryType: "pickup",
        deliveryCity: "Минск",
        deliveryBranch: "Самовывоз",
        paymentMethod: "erip_invoice",
      });

      expect(msg).toContain("Самовывоз в Минске");
      expect(msg).toContain("ЕРИП");
      expect(msg).toContain("Телефонный звонок");
    });
  });

  describe("buildOrderInlineKeyboard", () => {
    it("создает интерактивные кнопки подтверждения, отмены и перехода в админку", () => {
      const markup = buildOrderInlineKeyboard("order-123", "https://dollshop.by");
      expect(markup.inline_keyboard.length).toBe(2);

      const [firstRow, secondRow] = markup.inline_keyboard;
      const btn1 = firstRow?.[0] as { text: string; callback_data?: string } | undefined;
      const btn2 = firstRow?.[1] as { text: string; callback_data?: string } | undefined;
      const btn3 = secondRow?.[0] as { text: string; url?: string } | undefined;

      expect(btn1?.text).toContain("Подтвердить");
      expect(btn1?.callback_data).toBe("confirm_order:order-123");

      expect(btn2?.text).toContain("Отменить");
      expect(btn2?.callback_data).toBe("cancel_order:order-123");

      expect(btn3?.text).toContain("админке");
      expect(btn3?.url).toBe("https://dollshop.by/admin/zakazy");
    });
  });

  describe("formatCustomRequestMessage", () => {
    it("формирует сообщение о заявке «Хочу похожую»", () => {
      const msg = formatCustomRequestMessage({
        requestId: "req-1",
        customerName: "Елена",
        customerPhone: "+375251112233",
        contactChannel: "viber",
        referenceDollName: "Аврора",
        comment: "Хотелось бы крылышки с блестками",
      });

      expect(msg).toContain("НОВАЯ ЗАЯВКА «ХОЧУ ПОХОЖУЮ»");
      expect(msg).toContain("Аврора");
      expect(msg).toContain("Елена");
      expect(msg).toContain("+375 (25) 111-22-33");
      expect(msg).toContain("Viber");
      expect(msg).toContain("крылышки с блестками");
    });
  });

  describe("sendTelegramMessage", () => {
    it("работает в безопасном fallback режиме, если переменные окружения не заданы", async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const res = await sendTelegramMessage({ text: "Тестовое сообщение" });
      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("отправляет HTTP запрос в Telegram API при наличии токена", async () => {
      process.env.TELEGRAM_BOT_TOKEN = "mock_bot_token";
      process.env.TELEGRAM_CHAT_ID = "12345678";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 999 } }),
      });
      globalThis.fetch = mockFetch;

      const res = await sendTelegramMessage({ text: "Новый заказ" });
      expect(res.success).toBe(true);
      expect(res.messageId).toBe(999);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.telegram.org/botmock_bot_token/sendMessage",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("notifyNewOrder форматирует заказ и вызывает отправку сообщения", async () => {
      process.env.TELEGRAM_BOT_TOKEN = "mock_bot_token";
      process.env.TELEGRAM_CHAT_ID = "12345678";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 1001 } }),
      });
      globalThis.fetch = mockFetch;

      const res = await notifyNewOrder({
        orderId: "order-uuid-1",
        orderNumber: 42,
        dollName: "Фея Магнолия",
        dollPriceByn: 95.0,
        customerName: "Анна",
        customerPhone: "+375291112233",
        customerContact: "@anna_tg",
        contactChannel: "telegram",
        deliveryType: "pickup",
        deliveryCity: "Минск",
        deliveryBranch: "Самовывоз",
        paymentMethod: "cod",
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("мягко перехватывает ошибку сети и не выбрасывает исключение", async () => {
      process.env.TELEGRAM_BOT_TOKEN = "mock_bot_token";
      process.env.TELEGRAM_CHAT_ID = "12345678";

      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const res = await sendTelegramMessage({ text: "Сбой сети" });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Network timeout");
    });
  });
});
