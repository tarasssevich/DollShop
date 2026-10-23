import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { client } from "@/db/client";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Step 5.3 — Telegram Webhook: Интерактивные кнопки управления", () => {
  const originalEnv = { ...process.env };
  let testProductId: string;
  let testOrderId: string;
  const testSlug = `tg-webhook-doll-${Date.now()}`;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = "test_bot_token";
    process.env.TELEGRAM_CHAT_ID = "123456789";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    // 1. Создаем тестовую куклу в статусе 'reserved'
    const [prod] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Телеграма',
        'Тестовое описание',
        '{"height_cm": 20}'::jsonb,
        80.00,
        'BYN',
        'reserved'
      )
      RETURNING id;
    `;
    testProductId = prod!.id;

    // 2. Создаем тестовый заказ
    const [ord] = await client<Array<{ id: string }>>`
      INSERT INTO orders (
        customer_name, customer_phone, contact_channel, delivery_city, delivery_branch,
        total_amount, status, payment_method, pd_consent_at
      ) VALUES (
        'Тест', '+375291111111', 'telegram', 'Минск', 'Самовывоз',
        80.00, 'pending', 'cod', now()
      )
      RETURNING id;
    `;
    testOrderId = ord!.id;

    await client`
      INSERT INTO order_items (order_id, product_id, price_at_purchase)
      VALUES (${testOrderId}::uuid, ${testProductId}::uuid, 80.00);
    `;
  });

  afterEach(async () => {
    process.env = originalEnv;
    if (testOrderId) {
      await client`DELETE FROM order_items WHERE order_id = ${testOrderId}::uuid`;
      await client`DELETE FROM orders WHERE id = ${testOrderId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("обрабатывает кнопку '✅ Подтвердить продажу' (confirm_order): переводит заказ в paid и куклу в sold", async () => {
    const payload = {
      update_id: 1001,
      callback_query: {
        id: "cb_1",
        from: { id: 123456789 },
        message: {
          message_id: 555,
          chat: { id: 123456789 },
          text: "🎀 НОВЫЙ ЗАКАЗ #101\nКукла: «Фея Телеграма»",
        },
        data: `confirm_order:${testOrderId}`,
      },
    };

    const req = new NextRequest("http://localhost:3000/api/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe("confirmed");

    // Проверяем статус заказа в PostgreSQL
    const [order] = await client<Array<{ status: string }>>`
      SELECT status FROM orders WHERE id = ${testOrderId}::uuid;
    `;
    expect(order?.status).toBe("paid");

    // Проверяем статус куклы в PostgreSQL (должна стать 'sold')
    const [prod] = await client<Array<{ status: string }>>`
      SELECT status FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prod?.status).toBe("sold");
  });

  it("обрабатывает кнопку '❌ Отменить бронь' (cancel_order): переводит заказ в cancelled и возвращает куклу в available", async () => {
    const payload = {
      update_id: 1002,
      callback_query: {
        id: "cb_2",
        from: { id: 123456789 },
        message: {
          message_id: 556,
          chat: { id: 123456789 },
          text: "🎀 НОВЫЙ ЗАКАЗ #102\nКукла: «Фея Телеграма»",
        },
        data: `cancel_order:${testOrderId}`,
      },
    };

    const req = new NextRequest("http://localhost:3000/api/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe("cancelled");

    // Заказ стал cancelled
    const [order] = await client<Array<{ status: string }>>`
      SELECT status FROM orders WHERE id = ${testOrderId}::uuid;
    `;
    expect(order?.status).toBe("cancelled");

    // Кукла снова available
    const [prod] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prod?.status).toBe("available");
    expect(prod?.reserved_until).toBeNull();
  });

  it("отклоняет вебхук с некорректным секретным токеном", async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = "super_secret_token";

    const req = new NextRequest("http://localhost:3000/api/telegram/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-bot-api-secret-token": "wrong_secret",
      },
      body: JSON.stringify({ update_id: 1 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
