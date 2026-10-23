import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createOrderAction } from "../order";
import { reserveProductAction } from "../reserve";
import { getReservationCookieName } from "@/lib/reservation/token";
import { client } from "@/db/client";

const cookieJar = new Map<string, { value: string; options?: unknown }>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string, options?: unknown) => {
      cookieJar.set(name, { value, options });
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Mock telegram notifications so tests don't make network calls
vi.mock("@/lib/notify/telegram", () => ({
  notifyNewOrder: vi.fn().mockResolvedValue({ success: true, simulated: true }),
  notifyCustomRequest: vi.fn().mockResolvedValue({ success: true, simulated: true }),
}));

describe("Step 5.2 — Server Actions: Оформление заказа (createOrderAction)", () => {
  let testProductId: string;
  const testSlug = `order-test-fairy-${Date.now()}`;
  let createdOrderId: string | null = null;

  beforeEach(async () => {
    cookieJar.clear();

    const [created] = await client<Array<{ id: string; slug: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Заказа 5.2',
        'Проверка создания заказа почтой или самовывозом',
        '{"height_cm": 22, "materials": ["хлопок", "дерево"]}'::jsonb,
        85.00,
        'BYN',
        'available'
      )
      RETURNING id, slug;
    `;

    if (!created) throw new Error("Не удалось создать куклу для теста");
    testProductId = created.id;
  });

  afterEach(async () => {
    if (createdOrderId) {
      await client`DELETE FROM order_items WHERE order_id = ${createdOrderId}::uuid`;
      await client`DELETE FROM orders WHERE id = ${createdOrderId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM reservations WHERE product_id = ${testProductId}::uuid`;
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("успешно создает заказ с наложенным платежом и доставкой почтой по Беларуси", async () => {
    // 1. Сначала бронируем куклу (Step 5.1)
    const reserveRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });
    expect(reserveRes.success).toBe(true);

    const cookieName = getReservationCookieName(testProductId);
    expect(cookieJar.has(cookieName)).toBe(true);

    // 2. Оформляем заказ (Step 5.2)
    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея Заказа 5.2",
      dollPriceByn: 85,
      customerName: "Иванова Анна Петровна",
      customerPhone: "+375 (29) 111-22-33",
      contactChannel: "telegram",
      customerContact: "@anna_fairy",
      deliveryType: "postal",
      deliveryCity: "Гродно",
      deliveryBranch: "ОПС № 230005, ул. Советская 1",
      paymentMethod: "cod", // Наложенный платёж
      comment: "Пожалуйста, бережно упакуйте в подарок",
      pdConsent: true,
      offerConsent: true,
    });

    expect(orderRes.success).toBe(true);
    if (!orderRes.success) return;

    expect(orderRes.orderNumber).toBeGreaterThan(0);
    expect(orderRes.publicToken).toBeDefined();
    expect(orderRes.redirectUrl).toBe(`/zakaz/${orderRes.publicToken}`);

    // Cookie временной брони должна быть удалена
    expect(cookieJar.has(cookieName)).toBe(false);

    // Проверяем запись в таблице orders
    const [order] = await client<
      Array<{
        id: string;
        order_number: number;
        total_amount: string;
        status: string;
        payment_method: string;
        delivery_city: string;
        delivery_branch: string;
      }>
    >`
      SELECT id, order_number, total_amount, status, payment_method, delivery_city, delivery_branch
      FROM orders
      WHERE public_token = ${orderRes.publicToken}::uuid;
    `;

    expect(order).toBeDefined();
    createdOrderId = order!.id;
    expect(order?.status).toBe("pending");
    expect(parseFloat(order!.total_amount)).toBe(85.0);
    expect(order?.payment_method).toBe("cod");
    expect(order?.delivery_city).toBe("Гродно");
    expect(order?.delivery_branch).toContain("ОПС № 230005");

    // В таблице products кукла остается в статусе 'reserved', и срок продлен на 24 часа
    const [prod] = await client<Array<{ status: string; reserved_until: Date }>>`
      SELECT status, reserved_until FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prod?.status).toBe("reserved");
    const hoursRemaining = (new Date(prod!.reserved_until).getTime() - Date.now()) / (3600 * 1000);
    expect(hoursRemaining).toBeGreaterThan(20);

    // Из таблицы reservations временный токен удален, так как куклу теперь держит сам заказ
    const [resv] = await client<Array<{ product_id: string }>>`
      SELECT product_id FROM reservations WHERE product_id = ${testProductId}::uuid;
    `;
    expect(resv).toBeUndefined();
  });

  it("успешно создает заказ с самовывозом в Минске и оплатой через ЕРИП", async () => {
    await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея Заказа 5.2",
      dollPriceByn: 85,
      customerName: "Смирнов Алексей",
      customerPhone: "+375 (33) 999-88-77",
      contactChannel: "viber",
      deliveryType: "pickup",
      paymentMethod: "erip_invoice",
      pdConsent: true,
      offerConsent: true,
    });

    expect(orderRes.success).toBe(true);
    if (!orderRes.success) return;

    const [order] = await client<Array<{ id: string; delivery_city: string; delivery_branch: string }>>`
      SELECT id, delivery_city, delivery_branch FROM orders WHERE public_token = ${orderRes.publicToken}::uuid;
    `;
    createdOrderId = order!.id;
    expect(order?.delivery_city).toBe("Минск");
    expect(order?.delivery_branch).toContain("Самовывоз");
  });

  it("отклоняет заказ, если у пользователя истекла или отсутствует бронь в cookie", async () => {
    // Не вызываем reserveProductAction -> cookie пустая
    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея Заказа 5.2",
      dollPriceByn: 85,
      customerName: "Иванова Анна",
      customerPhone: "+375291112233",
      contactChannel: "telegram",
      deliveryType: "pickup",
      paymentMethod: "erip_invoice",
      pdConsent: true,
      offerConsent: true,
    });

    expect(orderRes.success).toBe(false);
    if (!orderRes.success) {
      expect(orderRes.code).toBe("RESERVATION_EXPIRED");
      expect(orderRes.error).toContain("Время действия вашей 15-минутной брони истекло");
    }
  });

  it("отклоняет заказ при некорректном белорусском номере телефона", async () => {
    await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея",
      dollPriceByn: 85,
      customerName: "Иванова Анна",
      customerPhone: "+1 (555) 123-4567", // Не Беларусь
      contactChannel: "telegram",
      deliveryType: "pickup",
      paymentMethod: "erip_invoice",
      pdConsent: true,
      offerConsent: true,
    });

    expect(orderRes.success).toBe(false);
    if (!orderRes.success) {
      expect(orderRes.code).toBe("VALIDATION_ERROR");
      expect(orderRes.error).toContain("Беларуси");
    }
  });

  it("отклоняет почтовую доставку без указания города и почтового отделения", async () => {
    await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея",
      dollPriceByn: 85,
      customerName: "Иванова Анна",
      customerPhone: "+375 29 111-22-33",
      contactChannel: "telegram",
      deliveryType: "postal",
      deliveryCity: "", // Пустой город
      deliveryBranch: "",
      paymentMethod: "cod",
      pdConsent: true,
      offerConsent: true,
    });

    expect(orderRes.success).toBe(false);
    if (!orderRes.success) {
      expect(orderRes.code).toBe("VALIDATION_ERROR");
    }
  });

  it("активирует honeypot-ловушку: бот не попадает в базу данных", async () => {
    const orderRes = await createOrderAction({
      productId: testProductId,
      slug: testSlug,
      dollName: "Фея",
      dollPriceByn: 85,
      customerName: "Spam Bot",
      customerPhone: "+375 29 111-22-33",
      contactChannel: "telegram",
      deliveryType: "pickup",
      paymentMethod: "erip_invoice",
      pdConsent: true,
      offerConsent: true,
      honeypot: "i am a spam bot",
    });

    // Возвращает фиктивный успех, но заказ не создается
    expect(orderRes.success).toBe(true);
    if (orderRes.success) {
      expect(orderRes.orderNumber).toBe(0);
    }
  });
});
