import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCustomRequestAction } from "../request";
import { resetRateLimit } from "@/lib/security/rate-limit";
import { client } from "@/db/client";

// Mock headers to provide deterministic IP
vi.mock("next/headers", () => ({
  headers: vi.fn().mockImplementation(async () => ({
    get: (name: string) => {
      if (name === "x-forwarded-for") return "192.168.1.100";
      return null;
    },
  })),
}));

// Mock telegram notifications
vi.mock("@/lib/notify/telegram", () => ({
  notifyCustomRequest: vi.fn().mockResolvedValue({ success: true, simulated: true }),
}));

describe("Step 5.4 — Server Actions: Заявки «Хочу похожую» (createCustomRequestAction)", () => {
  let testProductId: string;
  let createdRequestId: string | null = null;
  const testSlug = `custom-req-fairy-${Date.now()}`;

  beforeEach(async () => {
    resetRateLimit();

    const [prod] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Для Референса',
        'Кукла для проверки заявок',
        '{"height_cm": 20}'::jsonb,
        70.00,
        'BYN',
        'available'
      )
      RETURNING id;
    `;
    testProductId = prod!.id;
  });

  afterEach(async () => {
    if (createdRequestId) {
      await client`DELETE FROM custom_requests WHERE id = ${createdRequestId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("успешно сохраняет заявку в базу данных с привязкой к референсной кукле", async () => {
    const res = await createCustomRequestAction({
      customerName: "Татьяна",
      customerPhone: "+375 (29) 555-44-33",
      contactChannel: "telegram",
      customerContact: "@tanya_dolls",
      referenceSlug: testSlug,
      wishes: "Хотелось бы куколку в розовом платье с колокольчиками",
      pdConsent: true,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.requestId).toBeDefined();
    createdRequestId = res.requestId!;

    // Проверяем запись в PostgreSQL
    const [row] = await client<
      Array<{
        id: string;
        customer_name: string;
        customer_phone: string;
        contact_channel: string;
        reference_product_id: string;
        status: string;
        wishes: string;
      }>
    >`
      SELECT id, customer_name, customer_phone, contact_channel, reference_product_id, status, wishes
      FROM custom_requests
      WHERE id = ${createdRequestId}::uuid;
    `;

    expect(row).toBeDefined();
    expect(row?.customer_name).toBe("Татьяна");
    expect(row?.customer_phone).toBe("+375295554433");
    expect(row?.contact_channel).toBe("telegram");
    expect(row?.reference_product_id).toBe(testProductId);
    expect(row?.status).toBe("new");
    expect(row?.wishes).toContain("розовом платье");
  });

  it("отклоняет заявку при некорректном номере телефона", async () => {
    const res = await createCustomRequestAction({
      customerName: "Мария",
      customerPhone: "12345",
      contactChannel: "call",
      wishes: "Пожалуйста, свяжитесь со мной",
      pdConsent: true,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("VALIDATION_ERROR");
      expect(res.error).toContain("Беларуси");
    }
  });

  it("отклоняет заявку без согласия на обработку персональных данных", async () => {
    const res = await createCustomRequestAction({
      customerName: "Мария",
      customerPhone: "+375291234567",
      contactChannel: "telegram",
      wishes: "Куколка в подарок",
      pdConsent: false,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("VALIDATION_ERROR");
      expect(res.error).toContain("согласие");
    }
  });

  it("активирует honeypot-ловушку: спам-бот получает успешный ответ, но запись в БД не создается", async () => {
    const res = await createCustomRequestAction({
      customerName: "Bot",
      customerPhone: "+375291234567",
      contactChannel: "telegram",
      wishes: "Spam link http://example.com",
      pdConsent: true,
      honeypot: "i-am-a-bot",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.requestId).toBeUndefined();
    }
  });

  it("ограничивает частоту запросов (rate-limiting): 4-я заявка подряд блокируется", async () => {
    // Делаем 3 разрешенные заявки
    for (let i = 0; i < 3; i++) {
      const res = await createCustomRequestAction({
        customerName: `Клиент ${i}`,
        customerPhone: `+37529111223${i}`,
        contactChannel: "telegram",
        wishes: `Тестовые пожелания номер ${i}`,
        pdConsent: true,
      });
      expect(res.success).toBe(true);
      if (res.success && res.requestId) {
        await client`DELETE FROM custom_requests WHERE id = ${res.requestId}::uuid`;
      }
    }

    // 4-я заявка с того же IP должна быть отклонена
    const blockedRes = await createCustomRequestAction({
      customerName: "Клиент 4",
      customerPhone: "+375291112234",
      contactChannel: "telegram",
      wishes: "Тестовые пожелания 4",
      pdConsent: true,
    });

    expect(blockedRes.success).toBe(false);
    if (!blockedRes.success) {
      expect(blockedRes.code).toBe("RATE_LIMITED");
      expect(blockedRes.error).toContain("несколько заявок подряд");
    }
  });
});
