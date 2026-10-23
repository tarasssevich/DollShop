import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAdminOrdersAction,
  updateAdminOrderStatusAction,
  updateAdminOrderTrackingAction,
} from "../orders";
import { client } from "@/db/client";
import * as guardModule from "@/lib/auth/guard";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Admin Orders Actions (Step 5.5 - Zero-IT UX)", () => {
  let testProductId: string;
  let testOrderId: string;

  beforeEach(async () => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Мастер",
        email: "master@dollshop.by",
        role: "admin",
      },
      session: {
        id: "sess-1",
        expiresAt: new Date(Date.now() + 3600000),
        token: "tok-1",
        userId: "a0000000-0000-0000-0000-000000000001",
      },
    });

    // Create test product
    const [p] = await client`
      INSERT INTO products (
        title, slug, story, price, specs, status
      ) VALUES (
        'Тестовая Кукла Заказа',
        ${`test-order-doll-${Date.now()}`},
        'Кукла для тестирования заказов',
        85.00,
        '{"height_cm": 22, "materials": ["Хлопок"]}'::jsonb,
        'reserved'
      ) RETURNING id
    `;
    testProductId = p!.id;

    // Create test order
    const [o] = await client<Array<{ id: string; order_number: number }>>`
      INSERT INTO orders (
        customer_name, customer_phone, customer_contact,
        delivery_city, delivery_branch, payment_method, total_amount, status, pd_consent_at
      ) VALUES (
        'Екатерина Тест',
        '+375291234567',
        '@kate_tg',
        'Брест',
        'Отделение 224001',
        'cod',
        85.00,
        'pending',
        NOW()
      ) RETURNING id, order_number
    `;
    testOrderId = o!.id;

    // Link item to order
    await client`
      INSERT INTO order_items (
        order_id, product_id, price_at_purchase
      ) VALUES (
        ${testOrderId}::uuid,
        ${testProductId}::uuid,
        85.00
      )
    `;
  });

  afterEach(async () => {
    if (testOrderId) {
      await client`DELETE FROM orders WHERE id = ${testOrderId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("getAdminOrdersAction возвращает список заказов с привязанными данными куклы", async () => {
    const res = await getAdminOrdersAction();
    expect(res.success).toBe(true);
    expect(res.orders.length).toBeGreaterThan(0);

    const found = res.orders.find((o) => o.id === testOrderId);
    expect(found).toBeDefined();
    expect(typeof found?.orderNumber).toBe("number");
    expect(found?.customerName).toBe("Екатерина Тест");
    expect(found?.customerPhone).toBe("+375291234567");
    expect(found?.paymentMethod).toBe("cod");
    expect(found?.doll?.title).toBe("Тестовая Кукла Заказа");
  });

  it("updateAdminOrderStatusAction переводит статус в 'paid' и переводит куклу в статус 'sold' (Галерея)", async () => {
    const res = await updateAdminOrderStatusAction({
      orderId: testOrderId,
      status: "paid",
    });

    expect(res.success).toBe(true);

    const [orderRow] = await client<Array<{ status: string }>>`SELECT status FROM orders WHERE id = ${testOrderId}::uuid`;
    expect(orderRow?.status).toBe("paid");

    const [productRow] = await client<Array<{ status: string }>>`SELECT status FROM products WHERE id = ${testProductId}::uuid`;
    expect(productRow?.status).toBe("sold");
  });

  it("updateAdminOrderStatusAction переводит статус в 'cancelled' и возвращает куклу на витрину ('available')", async () => {
    const res = await updateAdminOrderStatusAction({
      orderId: testOrderId,
      status: "cancelled",
    });

    expect(res.success).toBe(true);

    const [orderRow] = await client<Array<{ status: string }>>`SELECT status FROM orders WHERE id = ${testOrderId}::uuid`;
    expect(orderRow?.status).toBe("cancelled");

    const [productRow] = await client<Array<{ status: string }>>`SELECT status FROM products WHERE id = ${testProductId}::uuid`;
    expect(productRow?.status).toBe("available");
  });

  it("updateAdminOrderTrackingAction сохраняет почтовый трек-номер отправления", async () => {
    const res = await updateAdminOrderTrackingAction({
      orderId: testOrderId,
      trackingNumber: "BY123456789",
    });

    expect(res.success).toBe(true);

    const [orderRow] = await client<Array<{ tracking_number: string | null }>>`SELECT tracking_number FROM orders WHERE id = ${testOrderId}::uuid`;
    expect(orderRow?.tracking_number).toBe("BY123456789");
  });

  it("updateAdminOrderStatusAction отклоняет невалидный UUID", async () => {
    const res = await updateAdminOrderStatusAction({
      orderId: "invalid-uuid",
      status: "paid",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
