import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CheckoutPage, { generateMetadata } from "../page";
import { client } from "@/db/client";
import {
  getReservationCookieName,
  hashReservationToken,
} from "@/lib/reservation/token";

const cookieJar = new Map<string, { value: string }>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => cookieJar.get(name),
  })),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
  }),
}));

describe("Step 5.1 — Страница чекаута (/oformlenie/[slug])", () => {
  let testProductId: string;
  const testSlug = `fairy-checkout-test-${Date.now()}`;
  const testToken = `test-cookie-token-${Date.now()}`;

  beforeEach(async () => {
    cookieJar.clear();

    const [created] = await client<Array<{ id: string; slug: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Фея Чекаута',
        'Тестовая кукла для проверки страницы оформления',
        '{"height_cm": 25, "materials": ["лен", "кружево"]}'::jsonb,
        89.00,
        'BYN',
        'available'
      )
      RETURNING id, slug;
    `;

    if (!created) throw new Error("Не удалось создать куклу для теста");
    testProductId = created.id;
  });

  afterEach(async () => {
    if (testProductId) {
      await client`DELETE FROM reservations WHERE product_id = ${testProductId}::uuid`;
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("generateMetadata формирует корректные метаданные для куклы", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: testSlug }),
    });

    expect(meta.title).toContain("Оформление заказа · Фея Чекаута");
    expect(meta.description).toContain("Почта по Беларуси или самовывоз в Минске");
  });

  it("generateMetadata возвращает 'Кукла не найдена', если слаг не существует", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "non-existent-slug" }),
    });

    expect(meta.title).toBe("Кукла не найдена | DollShop");
  });

  it("вызывает notFound(), если кукла не найдена в базе данных", async () => {
    await expect(
      CheckoutPage({
        params: Promise.resolve({ slug: "non-existent-slug" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("отображает экран 'Время бронирования истекло', если у пользователя нет cookie брони", async () => {
    const jsx = await CheckoutPage({
      params: Promise.resolve({ slug: testSlug }),
    });

    expect(jsx).toBeDefined();
    const html = renderToStaticMarkup(jsx);
    expect(html).toContain("Время бронирования истекло");
    expect(html).toContain("Вернуться к кукле");
    expect(html).toContain("Заказать похожую фею");
  });

  it("отображает полноценный чекаут со сводкой куклы и таймером, если бронь активна", async () => {
    // 1. Создаем активную бронь в БД
    const tokenHash = hashReservationToken(testToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await client`
      UPDATE products
      SET status = 'reserved', reserved_until = ${expiresAt.toISOString()}
      WHERE id = ${testProductId}::uuid;
    `;

    await client`
      INSERT INTO reservations (product_id, token_hash, expires_at)
      VALUES (${testProductId}::uuid, ${tokenHash}, ${expiresAt.toISOString()});
    `;

    // 2. Добавляем токен в cookie
    cookieJar.set(getReservationCookieName(testProductId), { value: testToken });

    // 3. Рендерим страницу
    const jsx = await CheckoutPage({
      params: Promise.resolve({ slug: testSlug }),
    });

    expect(jsx).toBeDefined();
    const html = renderToStaticMarkup(jsx);
    expect(html).toContain("Забронированная работа");
    expect(html).toContain("Фея Чекаута");
    expect(html).toContain("89 BYN");
    expect(html).toContain("Почта по Беларуси");
    expect(html).toContain("Самовывоз в Минске");
  });
});
