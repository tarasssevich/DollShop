import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import OrderSuccessPage, { generateMetadata } from "../page";
import { client } from "@/db/client";

vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("Step 5.2 — Страница подтверждения заказа (/zakaz/[token])", () => {
  let testProductId: string;
  let testOrderId: string;
  const testPublicToken = "00000000-1111-2222-3333-444444444444";
  const testSlug = `order-page-test-${Date.now()}`;

  beforeEach(async () => {
    // 1. Создаем тестовую куклу
    const [prod] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Весны',
        'Тестовое описание',
        '{"height_cm": 20}'::jsonb,
        95.00,
        'BYN',
        'reserved'
      )
      RETURNING id;
    `;
    testProductId = prod!.id;

    // 2. Создаем тестовый заказ
    const [ord] = await client<Array<{ id: string; order_number: number }>>`
      INSERT INTO orders (
        customer_name,
        customer_phone,
        contact_channel,
        delivery_city,
        delivery_branch,
        total_amount,
        status,
        payment_method,
        public_token,
        pd_consent_at
      ) VALUES (
        'Тестовая Анна',
        '+375291234567',
        'telegram',
        'Брест',
        'ОПС № 224001, ул. Ленина 5',
        95.00,
        'pending',
        'cod',
        ${testPublicToken}::uuid,
        now()
      )
      RETURNING id, order_number;
    `;
    testOrderId = ord!.id;

    // 3. Создаем позицию в заказе
    await client`
      INSERT INTO order_items (order_id, product_id, price_at_purchase)
      VALUES (${testOrderId}::uuid, ${testProductId}::uuid, 95.00);
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

  it("generateMetadata формирует корректный заголовок с номером заказа", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ token: testPublicToken }),
    });

    expect(meta.title).toContain("оформлен | DollShop");
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("вызывает notFound(), если заказ с данным public_token не найден", async () => {
    await expect(
      OrderSuccessPage({
        params: Promise.resolve({ token: "00000000-0000-0000-0000-000000000000" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("успешно рендерит страницу заказа: номер, кукла, сумма, почта и наложенный платёж", async () => {
    const jsx = await OrderSuccessPage({
      params: Promise.resolve({ token: testPublicToken }),
    });

    expect(jsx).toBeDefined();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Спасибо за ваш заказ!");
    expect(html).toContain("Фея Весны");
    expect(html).toContain("95 BYN");
    expect(html).toContain("Почта по Беларуси");
    expect(html).toContain("Брест");
    expect(html).toContain("ОПС № 224001");
    expect(html).toContain("Наложенный платёж");
    expect(html).toContain("Тестовая Анна");
    expect(html).toContain("+375 (29) 123-45-67");
    expect(html).toContain("Написать в Telegram");
  });
});
