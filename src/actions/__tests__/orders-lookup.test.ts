import { describe, it, expect, beforeEach, afterEach } from "vitest";
import postgres from "postgres";
import { findOrdersByPhoneAction, getMySavedOrdersAction } from "@/actions/order";
import { getOrdersByCustomerPhone } from "@/lib/data/orders";

const client = postgres(
  process.env.DATABASE_URL ||
    "postgres://app_user:dollshop_dev_password@localhost:5433/dollshop"
);

describe("Zero-Friction Order Tracking & Phone Lookup", () => {
  let testProductId: string;
  let testOrderId: string;
  const testPhone = "+375299998877";

  beforeEach(async () => {
    // Создаем тестовый товар
    const productRows = await client`
      INSERT INTO products (
        title, slug, story, specs, price, status
      ) VALUES (
        'Тестовая Кукла Для Поиска',
        'test-doll-phone-search',
        'История куклы для поиска',
        '{"heightCm": 30, "materials": ["хлопок"], "productionYear": 2026}'::jsonb,
        150.00,
        'sold'
      )
      RETURNING id;
    `;
    if (!productRows[0]) throw new Error("Не удалось создать тестовый товар");
    testProductId = productRows[0].id;

    // Создаем тестовый заказ
    const orderRows = await client`
      INSERT INTO orders (
        customer_name,
        customer_phone,
        contact_channel,
        delivery_city,
        delivery_branch,
        total_amount,
        status,
        payment_method,
        tracking_number,
        pd_consent_at
      ) VALUES (
        'Анастасия',
        ${testPhone},
        'telegram',
        'Минск',
        'Самовывоз',
        150.00,
        'paid',
        'online_card',
        'BY123456789',
        NOW()
      )
      RETURNING id, public_token, order_number;
    `;
    if (!orderRows[0]) throw new Error("Не удалось создать тестовый заказ");
    testOrderId = orderRows[0].id;

    // Привязываем позицию заказа
    await client`
      INSERT INTO order_items (order_id, product_id, price_at_purchase)
      VALUES (${testOrderId}::uuid, ${testProductId}::uuid, 150.00);
    `;
  });

  afterEach(async () => {
    if (testOrderId) {
      await client`DELETE FROM order_items WHERE order_id = ${testOrderId}::uuid`;
      await client`DELETE FROM orders WHERE id = ${testOrderId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("getOrdersByCustomerPhone корректно находит заказ по нормализованному номеру", async () => {
    const list = await getOrdersByCustomerPhone("+375 (29) 999-88-77");
    expect(list.length).toBeGreaterThan(0);
    const found = list.find((o) => o.id === testOrderId);
    expect(found).toBeDefined();
    expect(found?.customerName).toBe("Анастасия");
    expect(found?.status).toBe("paid");
    expect(found?.trackingNumber).toBe("BY123456789");
    expect(found?.item?.productTitle).toBe("Тестовая Кукла Для Поиска");
  });

  it("findOrdersByPhoneAction отклоняет некорректный номер", async () => {
    const res = await findOrdersByPhoneAction("12345");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("корректный номер");
    }
  });

  it("findOrdersByPhoneAction успешно находит заказы и форматирует результат для покупателя", async () => {
    const res = await findOrdersByPhoneAction("8029 999 88 77");
    expect(res.success).toBe(true);
    if (res.success) {
      const found = res.orders.find((o) => o.dollTitle === "Тестовая Кукла Для Поиска");
      expect(found).toBeDefined();
      expect(found?.status).toBe("paid");
      expect(found?.trackingNumber).toBe("BY123456789");
      expect(found?.deliveryType).toBe("pickup");
      expect(found?.totalAmount).toBe(150);
    }
  });
});
