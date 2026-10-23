import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { client } from "@/db/client";
import { POST } from "../route";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Phase 6 — Payment Webhook (Step 6.4)", () => {
  let testProductId: string;
  let testOrderId: string;

  beforeEach(async () => {
    const testSlug = `webhook-doll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Создаем куклу
    const [prod] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Вебхук Фея',
        'Описание',
        '{"height_cm": 25}'::jsonb,
        150.00,
        'BYN',
        'reserved'
      )
      RETURNING id;
    `;
    testProductId = prod!.id;

    // 2. Создаем заказ
    const [ord] = await client<Array<{ id: string }>>`
      INSERT INTO orders (
        customer_name, customer_phone, contact_channel, delivery_city, delivery_branch,
        total_amount, status, payment_method, pd_consent_at
      ) VALUES (
        'Тест Вебхук', '+375299999999', 'telegram', 'Минск', 'Самовывоз',
        150.00, 'pending', 'online_card', now()
      )
      RETURNING id;
    `;
    testOrderId = ord!.id;

    // 3. Создаем связь order_items
    await client`
      INSERT INTO order_items (order_id, product_id, price_at_purchase)
      VALUES (${testOrderId}, ${testProductId}, 150.00);
    `;
  });

  it("должен успешно обрабатывать успешный вебхук оплаты", async () => {
    const payload = {
      transaction: {
        uid: "tx_webhook_test_123",
        status: "successful",
        amount: 15000,
        currency: "BYN",
        tracking_id: testOrderId,
        payment_method_type: "credit_card",
      },
    };

    const req = new NextRequest("http://localhost:3001/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe("paid");

    // Проверяем статус в БД
    const [orderRow] = await client<Array<{ status: string; payment_id: string | null }>>`
      SELECT status, payment_id FROM orders WHERE id = ${testOrderId}::uuid;
    `;
    expect(orderRow?.status).toBe("paid");
    expect(orderRow?.payment_id).toBe("tx_webhook_test_123");

    // Кукла должна стать 'sold'
    const [prodRow] = await client<Array<{ status: string }>>`
      SELECT status FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prodRow?.status).toBe("sold");
  });

  it("должен быть идемпотентным при повторном вызове вебхука", async () => {
    // Сначала помечаем заказ как оплаченный
    await client`
      UPDATE orders SET status = 'paid' WHERE id = ${testOrderId}::uuid;
    `;

    const payload = {
      transaction: {
        uid: "tx_repeat_123",
        status: "successful",
        amount: 15000,
        currency: "BYN",
        tracking_id: testOrderId,
      },
    };

    const req = new NextRequest("http://localhost:3001/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.message).toContain("идемпотентно");
  });

  it("должен возвращать 404, если заказ не найден", async () => {
    const nonExistentId = "a0000000-0000-0000-0000-000000000000";
    const payload = {
      transaction: {
        uid: "tx_not_found",
        status: "successful",
        amount: 10000,
        currency: "BYN",
        tracking_id: nonExistentId,
      },
    };

    const req = new NextRequest("http://localhost:3001/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
