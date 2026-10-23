import { describe, it, expect } from "vitest";
import { client } from "../client";
import {
  reserveProduct,
  releaseReservation,
  createOrder,
  setOrderStatus,
  expireReservations,
} from "../functions";

describe("Database Stored Functions: Reservation, Orders & Lifecycle (Step 3.4)", () => {
  it("проверяет полный жизненный цикл куклы: бронь -> заказ -> оплата -> sold", async () => {
    const slug = `flow-fairy-${Date.now()}`;
    const token = `token_hash_${Date.now()}`;

    // 1. Создаем куклу
    const [doll] = await client<Array<{ id: string; price: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (${slug}, 'Фея Цикла', 'История', '{"height_cm": 20, "materials": ["хлопок"]}'::jsonb, 55.00, 'BYN', 'available')
      RETURNING id, price;
    `;
    const dollId = doll!.id;

    // 2. Бронируем куклу
    const res = await reserveProduct(dollId, token, 15);
    expect(res.status).toBe("SUCCESS");
    expect(res.reservedUntil).toBeInstanceOf(Date);
    expect(res.errorCode).toBeNull();

    // 3. Создаем заказ
    const orderRes = await createOrder({
      productId: dollId,
      tokenHash: token,
      customerName: "Елена Минск",
      customerPhone: "+375291112233",
      contactChannel: "telegram",
      deliveryCity: "г. Минск",
      deliveryBranch: "ОПС № 42",
      paymentMethod: "erip_invoice",
    });

    expect(orderRes.errorCode).toBeNull();
    expect(orderRes.orderId).toBeDefined();
    expect(orderRes.orderNumber).toBeGreaterThan(0);
    expect(orderRes.publicToken).toBeDefined();
    expect(orderRes.totalAmount).toBe("55.00");

    // 4. Мастер подтверждает оплату -> кукла переходит в 'sold'
    const statusRes = await setOrderStatus(orderRes.orderId!, "paid");
    expect(statusRes.errorCode).toBeNull();
    expect(statusRes.status).toBe("paid");
    expect(statusRes.productStatus).toBe("sold");
    expect(statusRes.productSlug).toBe(slug);

    // Проверяем статус в самой таблице products
    const [updatedDoll] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${dollId}::uuid
    `;
    expect(updatedDoll?.status).toBe("sold");
    expect(updatedDoll?.reserved_until).toBeNull();

    // Очистка
    await client`DELETE FROM orders WHERE id = ${orderRes.orderId}::uuid`;
    await client`DELETE FROM products WHERE id = ${dollId}::uuid`;
  });

  it("проверяет отмену заказа: cancelled -> кукла возвращается в 'available'", async () => {
    const slug = `cancel-fairy-${Date.now()}`;
    const token = `token_cancel_${Date.now()}`;

    const [doll] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (${slug}, 'Фея Отмены', 'История', '{"height_cm": 20, "materials": ["хлопок"]}'::jsonb, 60.00, 'BYN', 'available')
      RETURNING id;
    `;
    const dollId = doll!.id;

    await reserveProduct(dollId, token, 15);
    const orderRes = await createOrder({
      productId: dollId,
      tokenHash: token,
      customerName: "Ольга",
      customerPhone: "+375293334455",
      contactChannel: "viber",
      deliveryCity: "г. Гродно",
      deliveryBranch: "ОПС № 1",
    });

    // Отменяем заказ
    const statusRes = await setOrderStatus(orderRes.orderId!, "cancelled");
    expect(statusRes.status).toBe("cancelled");
    expect(statusRes.productStatus).toBe("available");

    const [updatedDoll] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${dollId}::uuid
    `;
    expect(updatedDoll?.status).toBe("available");
    expect(updatedDoll?.reserved_until).toBeNull();

    // Cleanup
    await client`DELETE FROM orders WHERE id = ${orderRes.orderId}::uuid`;
    await client`DELETE FROM products WHERE id = ${dollId}::uuid`;
  });

  it("release_reservation освобождает куклу только при совпадении токена", async () => {
    const slug = `release-fairy-${Date.now()}`;
    const token = `correct_token_${Date.now()}`;

    const [doll] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (${slug}, 'Фея Релиза', 'История', '{"height_cm": 20, "materials": ["хлопок"]}'::jsonb, 50.00, 'BYN', 'available')
      RETURNING id;
    `;
    const dollId = doll!.id;

    await reserveProduct(dollId, token, 15);

    // Попытка освободить с неверным токеном
    const wrongRelease = await releaseReservation(dollId, "wrong_token_hash");
    expect(wrongRelease).toBe(false);

    // Освобождение с правильным токеном
    const correctRelease = await releaseReservation(dollId, token);
    expect(correctRelease).toBe(true);

    const [updatedDoll] = await client<Array<{ status: string }>>`
      SELECT status FROM products WHERE id = ${dollId}::uuid
    `;
    expect(updatedDoll?.status).toBe("available");

    await client`DELETE FROM products WHERE id = ${dollId}::uuid`;
  });

  it("expire_reservations автоматически возвращает истёкшие куклы в продажу", async () => {
    const slug = `expired-fairy-${Date.now()}`;
    const token = `expired_token_${Date.now()}`;

    // Создаем куклу с истёкшей бронью (в прошлом: now() - interval '1 minute')
    const [doll] = await client<Array<{ id: string }>>`
      INSERT INTO products (slug, title, story, specs, price, currency, status, reserved_until)
      VALUES (
        ${slug},
        'Фея Истечения',
        'История',
        '{"height_cm": 20, "materials": ["хлопок"]}'::jsonb,
        45.00,
        'BYN',
        'reserved',
        now() - interval '2 minutes'
      )
      RETURNING id;
    `;
    const dollId = doll!.id;

    await client`
      INSERT INTO reservations (product_id, token_hash, expires_at)
      VALUES (${dollId}::uuid, ${token}, now() - interval '2 minutes');
    `;

    // Запускаем очистку истёкших броней
    const expiredList = await expireReservations();
    const found = expiredList.find((item) => item.slug === slug);
    expect(found).toBeDefined();

    // Проверяем, что кукла вернулась в available
    const [updatedDoll] = await client<Array<{ status: string; reserved_until: Date | null }>>`
      SELECT status, reserved_until FROM products WHERE id = ${dollId}::uuid
    `;
    expect(updatedDoll?.status).toBe("available");
    expect(updatedDoll?.reserved_until).toBeNull();

    await client`DELETE FROM products WHERE id = ${dollId}::uuid`;
  });
});
