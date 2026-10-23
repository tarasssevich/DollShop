import { describe, it, expect, beforeEach, vi } from "vitest";
import { client } from "@/db/client";
import {
  simulateSandboxCardPaymentAction,
  simulateSandboxEripPaymentAction,
} from "../payments";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Phase 6 — Payment Actions (Step 6.2 & 6.3)", () => {
  let testProductId: string;
  let testOrderId: string;
  let testOrderNumber: number;

  beforeEach(async () => {
    const testSlug = `pay-action-doll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Создаем куклу
    const [prod] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Тестовая фея оплат',
        'Описание',
        '{"height_cm": 22}'::jsonb,
        135.00,
        'BYN',
        'reserved'
      )
      RETURNING id;
    `;
    testProductId = prod!.id;

    // 2. Создаем заказ
    const [ord] = await client<Array<{ id: string; order_number: number }>>`
      INSERT INTO orders (
        customer_name, customer_phone, contact_channel, delivery_city, delivery_branch,
        total_amount, status, payment_method, pd_consent_at
      ) VALUES (
        'Тестовый Покупатель', '+375291234567', 'telegram', 'Минск', 'Самовывоз',
        135.00, 'pending', 'online_card', now()
      )
      RETURNING id, order_number;
    `;
    testOrderId = ord!.id;
    testOrderNumber = ord!.order_number;

    // 3. Создаем связь order_items
    await client`
      INSERT INTO order_items (order_id, product_id, price_at_purchase)
      VALUES (${testOrderId}, ${testProductId}, 135.00);
    `;
  });

  it("должен успешно симулировать оплату картой и переводить заказ в статус paid", async () => {
    const res = await simulateSandboxCardPaymentAction({
      orderId: testOrderId,
      orderNumber: testOrderNumber,
      amountByn: 135,
      dollTitle: "Тестовая фея оплат",
      outcome: "success",
    });

    expect(res.success).toBe(true);

    const [orderRow] = await client<Array<{ status: string }>>`
      SELECT status FROM orders WHERE id = ${testOrderId}::uuid;
    `;
    expect(orderRow?.status).toBe("paid");

    const [prodRow] = await client<Array<{ status: string }>>`
      SELECT status FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prodRow?.status).toBe("sold");
  });

  it("должен возвращать ошибку при отклонении банком", async () => {
    const res = await simulateSandboxCardPaymentAction({
      orderId: testOrderId,
      orderNumber: testOrderNumber,
      amountByn: 135,
      dollTitle: "Тестовая фея оплат",
      outcome: "declined",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("отклонена");
  });

  it("должен успешно симулировать оплату через ЕРИП", async () => {
    const res = await simulateSandboxEripPaymentAction({
      orderId: testOrderId,
      orderNumber: testOrderNumber,
      amountByn: 135,
      dollTitle: "Тестовая фея оплат",
    });

    expect(res.success).toBe(true);

    const [orderRow] = await client<Array<{ status: string }>>`
      SELECT status FROM orders WHERE id = ${testOrderId}::uuid;
    `;
    expect(orderRow?.status).toBe("paid");
  });
});
