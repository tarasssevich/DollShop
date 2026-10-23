import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAdminLiveStateAction,
  adminReleaseReservationAction,
} from "../live-sync";
import { client } from "@/db/client";
import * as guardModule from "@/lib/auth/guard";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Admin Live Sync Actions (Real-time synchronization)", () => {
  let testProductId: string;
  let testSlug: string;

  beforeEach(async () => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Мастер",
        email: "master@dollshop.by",
        role: "admin",
      },
      session: {
        id: "sess-live-1",
        expiresAt: new Date(Date.now() + 3600000),
        token: "tok-live-1",
        userId: "a0000000-0000-0000-0000-000000000001",
      },
    });

    testSlug = `live-sync-doll-${Date.now()}`;
    const [p] = await client`
      INSERT INTO products (
        title, slug, story, price, specs, status, reserved_until
      ) VALUES (
        'Тестовая Кукла Синхронизации',
        ${testSlug},
        'Кукла для проверки связи витрины и админки',
        110.00,
        '{"height_cm": 20, "materials": ["Хлопок"]}'::jsonb,
        'reserved',
        NOW() + INTERVAL '15 minutes'
      ) RETURNING id
    `;
    testProductId = p!.id;

    // Добавляем запись в reservations
    await client`
      INSERT INTO reservations (product_id, token_hash, expires_at)
      VALUES (${testProductId}::uuid, 'fake-token-hash-123456', NOW() + INTERVAL '15 minutes')
      ON CONFLICT (product_id) DO UPDATE SET expires_at = NOW() + INTERVAL '15 minutes'
    `;
  });

  it("возвращает корректное live-состояние с активной бронью и stateHash", async () => {
    const state = await getAdminLiveStateAction();

    expect(state).toBeDefined();
    expect(typeof state.stateHash).toBe("string");
    expect(state.stateHash.length).toBe(32); // MD5 hex
    expect(state.activeReservations.length).toBeGreaterThanOrEqual(1);

    const match = state.activeReservations.find((r) => r.productId === testProductId);
    expect(match).toBeDefined();
    expect(match?.title).toBe("Тестовая Кукла Синхронизации");
    expect(match?.priceByn).toBe(110);
    expect(match?.secondsRemaining).toBeGreaterThan(0);
  });

  it("принудительно снимает бронь администратором и возвращает куклу в статус available", async () => {
    const res = await adminReleaseReservationAction({ productId: testProductId });
    expect(res.success).toBe(true);

    // Проверяем статус куклы в базе
    const [updatedProd] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${testProductId}::uuid
    `;
    expect(updatedProd).toBeDefined();
    expect(updatedProd?.status).toBe("available");
    expect(updatedProd?.reserved_until).toBeNull();

    // Проверяем удаление из таблицы reservations
    const resRows = await client`
      SELECT product_id FROM reservations WHERE product_id = ${testProductId}::uuid
    `;
    expect(resRows.length).toBe(0);

    // Проверяем, что в следующем опросе live-состояния этой брони уже нет
    const liveState = await getAdminLiveStateAction();
    const match = liveState.activeReservations.find((r) => r.productId === testProductId);
    expect(match).toBeUndefined();
  });

  it("возвращает ошибку при попытке снять бронь с несуществующей куклы", async () => {
    const res = await adminReleaseReservationAction({
      productId: "00000000-0000-0000-0000-000000000000",
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Кукла не найдена в базе данных");
  });
});
