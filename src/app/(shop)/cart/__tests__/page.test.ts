import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CartPage, { metadata } from "../page";
import { client } from "@/db/client";
import { hashReservationToken } from "@/lib/reservation/token";
import { getActiveReservationAction } from "@/actions/reserve";

// Mock next/headers cookies
const cookieMap = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieMap.has(name) ? { value: cookieMap.get(name) } : undefined,
    getAll: () =>
      Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
    set: vi.fn((name: string, value: string) => cookieMap.set(name, value)),
    delete: vi.fn((name: string) => cookieMap.delete(name)),
  })),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Cart and Reservation Page (/cart)", () => {
  let testProductId: string;
  const testSlug = `cart-test-fairy-${Date.now()}`;
  const testToken = `cart-token-${Date.now()}`;

  beforeEach(async () => {
    cookieMap.clear();

    const [created] = await client<Array<{ id: string; slug: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Корзины',
        'Тестовая фея для проверки корзины',
        '{"height_cm": 22, "materials": ["хлопок", "фатин"]}'::jsonb,
        65.00,
        'BYN',
        'available'
      )
      RETURNING id, slug;
    `;

    if (!created) throw new Error("Не удалось создать тестовый товар");
    testProductId = created.id;
  });

  afterEach(async () => {
    if (testProductId) {
      await client`DELETE FROM reservations WHERE product_id = ${testProductId}::uuid`;
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("генерирует корректные метаданные страницы корзины", () => {
    expect(metadata.title).toContain("Корзина");
    expect(metadata.title).toContain("DollShop");
  });

  it("отображает красивый пустой статус, когда у пользователя нет активной брони", async () => {
    const jsx = await CartPage();
    expect(jsx).toBeDefined();

    const html = renderToStaticMarkup(jsx);
    expect(html).toContain("В вашей корзине пока пусто");
    expect(html).toContain("Выбрать куклу в каталоге");
    expect(html).toContain("/kukly");
  });

  it("отображает забронированную куклу и таймер, если бронь активна", async () => {
    // 1. Создаем активную бронь в БД
    const tokenHash = hashReservationToken(testToken);
    const expiresAt = new Date(Date.now() + 14 * 60 * 1000);

    await client`
      UPDATE products
      SET status = 'reserved', reserved_until = ${expiresAt.toISOString()}
      WHERE id = ${testProductId}::uuid;
    `;

    await client`
      INSERT INTO reservations (product_id, token_hash, expires_at)
      VALUES (${testProductId}::uuid, ${tokenHash}, ${expiresAt.toISOString()});
    `;

    // 2. Устанавливаем cookie брони
    cookieMap.set(`doll_res_${testProductId}`, testToken);

    // 3. Проверяем getActiveReservationAction
    const resInfo = await getActiveReservationAction();
    expect(resInfo.hasReservation).toBe(true);
    if (resInfo.hasReservation) {
      expect(resInfo.dollName).toBe("Фея Корзины");
      expect(resInfo.priceByn).toBe(65);
    }

    // 4. Рендерим страницу корзины
    const jsx = await CartPage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Ваша бронь");
    expect(html).toContain("Фея Корзины");
    expect(html).toContain("65 BYN");
    expect(html).toContain("Кукла зафиксирована за вами на 15 минут");
    expect(html).toContain("Перейти к оформлению заказа");
  });
});
