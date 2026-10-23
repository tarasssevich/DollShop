import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  reserveProductAction,
  releaseReservationAction,
  checkReservationStatusAction,
} from "../reserve";
import {
  getReservationCookieName,
  hashReservationToken,
} from "@/lib/reservation/token";
import { client } from "@/db/client";

import { resetRateLimit } from "@/lib/security/rate-limit";

// In-memory cookie store mock for simulating browser sessions
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
  headers: vi.fn().mockImplementation(async () => new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Step 5.1 — Server Actions: Атомарная бронь куклы (reserveProductAction)", () => {
  let testProductId: string;
  const testSlug = `fairy-reserve-test-${Date.now()}`;

  beforeEach(async () => {
    resetRateLimit();
    cookieJar.clear();

    // Создаем тестовую куклу со статусом 'available'
    const [created] = await client<Array<{ id: string; slug: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (
        ${testSlug},
        'Тестовая фея брони',
        'Проверка бронирования Step 5.1',
        '{"height_cm": 22, "materials": ["лен", "дерево"]}'::jsonb,
        75.00,
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

  it("успешно бронирует куклу, сохраняет токен в cookie и переводит статус в reserved", async () => {
    const res = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.redirectUrl).toBe(`/oformlenie/${testSlug}`);
    expect(res.reservedUntil).toBeDefined();

    // Проверяем cookie
    const cookieName = getReservationCookieName(testProductId);
    const storedCookie = cookieJar.get(cookieName);
    expect(storedCookie).toBeDefined();
    expect(storedCookie?.value.length).toBeGreaterThanOrEqual(32);

    // Проверяем состояние в PostgreSQL
    const [prod] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prod?.status).toBe("reserved");
    expect(prod?.reserved_until).not.toBeNull();

    // Проверяем запись в таблице reservations
    const [reservation] = await client<Array<{ token_hash: string }>>`
      SELECT token_hash FROM reservations WHERE product_id = ${testProductId}::uuid;
    `;
    expect(reservation).toBeDefined();
    expect(reservation?.token_hash).toBe(hashReservationToken(storedCookie!.value));

    // Проверяем checkReservationStatusAction
    const statusCheck = await checkReservationStatusAction(testProductId);
    expect(statusCheck.hasReservation).toBe(true);
    if (statusCheck.hasReservation) {
      expect(statusCheck.secondsRemaining).toBeGreaterThan(800);
    }
  });

  it("обеспечивает идемпотентность: повторный вызов с тем же cookie возвращает успех", async () => {
    // Первый вызов
    const firstRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });
    expect(firstRes.success).toBe(true);

    const firstToken = cookieJar.get(getReservationCookieName(testProductId))?.value;

    // Второй вызов (покупатель нажал еще раз или перезагрузил страницу)
    const secondRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });
    expect(secondRes.success).toBe(true);

    const secondToken = cookieJar.get(getReservationCookieName(testProductId))?.value;
    expect(secondToken).toBe(firstToken);
  });

  it("отклоняет попытку бронирования другим пользователем (ALREADY_RESERVED)", async () => {
    // Пользователь А забронировал куклу
    const firstRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });
    expect(firstRes.success).toBe(true);

    // Пользователь Б приходит со своей чистой сессией (другой cookieJar)
    cookieJar.clear();

    const secondRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    expect(secondRes.success).toBe(false);
    if (!secondRes.success) {
      expect(secondRes.code).toBe("ALREADY_RESERVED");
      expect(secondRes.error).toContain("только что забронировали");
    }
  });

  it("проверяет конкурентную гонку: при одновременных запросах побеждает ровно один", async () => {
    // Симулируем 20 параллельных покупателей с независимыми сессиями
    const shoppers = Array.from({ length: 20 }, (_, i) => ({
      shopperId: `shopper-${i}`,
      token: `token-${i}-${Date.now()}`,
    }));

    const results = await Promise.all(
      shoppers.map(async (shopper) => {
        const tokenHash = hashReservationToken(shopper.token);
        // Вызываем атомарную функцию базы данных напрямую для моделирования разных браузеров
        const { reserveProduct } = await import("@/db/functions");
        return reserveProduct(testProductId, tokenHash, 15);
      })
    );

    const winners = results.filter((r) => r.status === "SUCCESS");
    const losers = results.filter((r) => r.status === "ERROR");

    expect(winners.length).toBe(1);
    expect(losers.length).toBe(19);
    expect(losers.every((l) => l.errorCode === "ALREADY_RESERVED")).toBe(true);
  });

  it("успешно освобождает бронь покупателем и возвращает куклу в статус available", async () => {
    // 1. Бронируем куклу
    await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    const cookieName = getReservationCookieName(testProductId);
    expect(cookieJar.has(cookieName)).toBe(true);

    // 2. Освобождаем бронь
    const releaseRes = await releaseReservationAction({
      productId: testProductId,
      slug: testSlug,
    });
    expect(releaseRes.success).toBe(true);

    // Cookie должна быть удалена
    expect(cookieJar.has(cookieName)).toBe(false);

    // В базе кукла снова доступна
    const [prod] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${testProductId}::uuid;
    `;
    expect(prod?.status).toBe("available");
    expect(prod?.reserved_until).toBeNull();

    // Запись из reservations удалена
    const [resRow] = await client<Array<{ product_id: string }>>`
      SELECT product_id FROM reservations WHERE product_id = ${testProductId}::uuid;
    `;
    expect(resRow).toBeUndefined();
  });

  it("возвращает ошибку SOLD, если кукла уже выкуплена", async () => {
    await client`
      UPDATE products SET status = 'sold' WHERE id = ${testProductId}::uuid;
    `;

    const res = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("SOLD");
      expect(res.error).toContain("уже обрела свой дом");
    }
  });

  it("отклоняет запросы при превышении лимита (RATE_LIMITED)", async () => {
    // Выполняем 15 запросов (допустимый лимит)
    for (let i = 0; i < 15; i++) {
      await reserveProductAction({
        productId: testProductId,
        slug: testSlug,
      });
    }

    // 16-й запрос должен быть заблокирован rate-limiter
    const blockedRes = await reserveProductAction({
      productId: testProductId,
      slug: testSlug,
    });

    expect(blockedRes.success).toBe(false);
    if (!blockedRes.success) {
      expect(blockedRes.code).toBe("RATE_LIMITED");
      expect(blockedRes.error).toContain("Слишком много попыток бронирования");
    }
  });
});
