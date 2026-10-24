import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAdminRequestsAction,
  updateAdminRequestStatusAction,
  updateAdminRequestPhotosAction,
  getAdminDollByIdAction,
  getAvailableDollsForRequestAction,
  attachExistingDollToRequestAction,
  markResponseDollSoldAction,
} from "../requests";
import { buildCustomOrderNotificationText } from "@/lib/notify/templates";
import { detachResponseDollAction } from "@/actions/admin/products";
import { client } from "@/db/client";
import * as guardModule from "@/lib/auth/guard";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Admin Requests Actions (Step 5.6 - Zero-IT UX)", () => {
  let testProductId: string;
  let testRequestId: string;

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

    // Create reference product
    const [p] = await client`
      INSERT INTO products (
        title, slug, story, price, specs, status
      ) VALUES (
        'Кукла Образец',
        ${`ref-doll-${Date.now()}`},
        'Образец для индивидуального заказа',
        90.00,
        '{"height_cm": 25, "materials": ["Хлопок", "Дерево"]}'::jsonb,
        'sold'
      ) RETURNING id
    `;
    testProductId = p!.id;

    // Create test custom request
    const [r] = await client<Array<{ id: string }>>`
      INSERT INTO custom_requests (
        customer_name, customer_phone, customer_contact, contact_channel,
        reference_product_id, wishes, status, pd_consent_at
      ) VALUES (
        'Анастасия Петрова',
        '+375336543210',
        '@anastasia_minsk',
        'telegram',
        ${testProductId}::uuid,
        'Очень хочу такую же куколку в подарок дочке на день рождения!',
        'new',
        NOW()
      ) RETURNING id
    `;
    testRequestId = r!.id;
  });

  afterEach(async () => {
    if (testRequestId) {
      await client`DELETE FROM custom_requests WHERE id = ${testRequestId}::uuid`;
    }
    if (testProductId) {
      await client`DELETE FROM products WHERE id = ${testProductId}::uuid`;
    }
  });

  it("getAdminRequestsAction возвращает список заявок с привязанной куклой-ориентиром", async () => {
    const res = await getAdminRequestsAction();
    expect(res.success).toBe(true);
    expect(res.requests.length).toBeGreaterThan(0);

    const found = res.requests.find((r) => r.id === testRequestId);
    expect(found).toBeDefined();
    expect(found?.customerName).toBe("Анастасия Петрова");
    expect(found?.customerPhone).toBe("+375336543210");
    expect(found?.contactChannel).toBe("telegram");
    expect(found?.referenceDoll?.title).toBe("Кукла Образец");
  });

  it("updateAdminRequestStatusAction переводит заявку в статус 'accepted'", async () => {
    const res = await updateAdminRequestStatusAction({
      requestId: testRequestId,
      status: "accepted",
    });

    expect(res.success).toBe(true);

    const [row] = await client<Array<{ status: string }>>`SELECT status FROM custom_requests WHERE id = ${testRequestId}::uuid`;
    expect(row?.status).toBe("accepted");
  });

  it("updateAdminRequestStatusAction переводит заявку в статус 'in_discussion'", async () => {
    const res = await updateAdminRequestStatusAction({
      requestId: testRequestId,
      status: "in_discussion",
    });

    expect(res.success).toBe(true);

    const [row] = await client<Array<{ status: string }>>`SELECT status FROM custom_requests WHERE id = ${testRequestId}::uuid`;
    expect(row?.status).toBe("in_discussion");
  });

  it("updateAdminRequestStatusAction отклоняет некорректный статус", async () => {
    const res = await updateAdminRequestStatusAction({
      requestId: testRequestId,
      // @ts-expect-error intentionally passing invalid status
      status: "invalid_status",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("корректно связывает куклу-ответ с заявкой и возвращает в getAdminRequestsAction", async () => {
    // 1. Создаем куклу-ответ
    const [respDoll] = await client`
      INSERT INTO products (
        title, slug, story, price, specs, status, is_custom_order, custom_request_id
      ) VALUES (
        'Индивидуальная фея Ромашка',
        ${`response-doll-${Date.now()}`},
        'Создана специально по индивидуальной заявке',
        65.00,
        '{"height_cm": 20, "materials": ["Хлопок", "Бусины"]}'::jsonb,
        'available',
        true,
        ${testRequestId}::uuid
      ) RETURNING id, slug, title
    `;

    // 2. Привязываем к заявке
    await client`
      UPDATE custom_requests
      SET response_product_id = ${respDoll!.id}::uuid, status = 'accepted'
      WHERE id = ${testRequestId}::uuid
    `;

    // 3. Проверяем получение через getAdminRequestsAction
    const res = await getAdminRequestsAction();
    expect(res.success).toBe(true);

    const found = res.requests.find((r) => r.id === testRequestId);
    expect(found).toBeDefined();
    expect(found?.status).toBe("accepted");
    expect(found?.responseDoll).toBeDefined();
    expect(found?.responseDoll?.id).toBe(respDoll!.id);
    expect(found?.responseDoll?.title).toBe("Индивидуальная фея Ромашка");
    expect(found?.responseDoll?.priceByn).toBe(65);
    expect(found?.responseDoll?.isCustomOrder).toBe(true);

    // 4. Проверяем getAdminDollByIdAction
    const dollByIdRes = await getAdminDollByIdAction(respDoll!.id);
    expect(dollByIdRes.success).toBe(true);
    expect(dollByIdRes.doll?.name).toBe("Индивидуальная фея Ромашка");

    // 5. Проверяем формирование уведомления
    const notifText = buildCustomOrderNotificationText({
      customerName: "Анастасия",
      dollTitle: "Индивидуальная фея Ромашка",
      priceByn: 65,
      slug: respDoll!.slug,
    });
    expect(notifText).toContain("Анастасия");
    expect(notifText).toContain("Индивидуальная фея Ромашка");
    expect(notifText).toContain("65.00 BYN");
    expect(notifText).toContain(`/kukly/${respDoll!.slug}`);

    // 6. Проверяем detachResponseDollAction
    const detachRes = await detachResponseDollAction(testRequestId);
    expect(detachRes.success).toBe(true);

    const [reqAfter] = await client<Array<{ response_product_id: string | null }>>`
      SELECT response_product_id FROM custom_requests WHERE id = ${testRequestId}::uuid
    `;
    expect(reqAfter?.response_product_id).toBeNull();

    // Чистим куклу-ответ
    await client`DELETE FROM products WHERE id = ${respDoll!.id}::uuid`;
  });

  it("updateAdminRequestPhotosAction обновляет список фото-референсов заявки", async () => {
    const newPhotos = [
      "/uploads/requests/ref-test-1.jpg",
      "/uploads/requests/ref-test-2.jpg",
    ];

    const res = await updateAdminRequestPhotosAction({
      requestId: testRequestId,
      photoUrls: newPhotos,
    });

    expect(res.success).toBe(true);

    const [updated] = await client<Array<{ reference_photo_urls: string[] }>>`
      SELECT reference_photo_urls FROM custom_requests WHERE id = ${testRequestId}::uuid
    `;
    expect(updated?.reference_photo_urls).toEqual(newPhotos);
  });

  it("attachExistingDollToRequestAction прикрепляет существующую куклу к заявке и меняет статус", async () => {
    // 1. Создаем существующую куклу со статусом 'available'
    const [existingDoll] = await client`
      INSERT INTO products (
        title, slug, story, price, specs, status
      ) VALUES (
        'Лесная нимфа Ирида',
        ${`attach-doll-${Date.now()}`},
        'Готовая авторская работа из каталога',
        110.00,
        '{"height_cm": 22, "materials": ["Хлопок", "Фатин"]}'::jsonb,
        'available'
      ) RETURNING id, slug, title
    `;

    try {
      // 2. Проверяем, что она отображается в списке доступных
      const availRes = await getAvailableDollsForRequestAction();
      expect(availRes.success).toBe(true);
      const inList = availRes.dolls.find((d) => d.id === existingDoll!.id);
      expect(inList).toBeDefined();
      expect(inList?.title).toBe("Лесная нимфа Ирида");

      // 3. Прикрепляем к заявке
      const attachRes = await attachExistingDollToRequestAction({
        requestId: testRequestId,
        productId: existingDoll!.id,
      });
      expect(attachRes.success).toBe(true);

      // 4. Проверяем, что заявка перешла в 'accepted', а кукла забронирована
      const [reqRow] = await client<Array<{ status: string; response_product_id: string }>>`
        SELECT status, response_product_id FROM custom_requests WHERE id = ${testRequestId}::uuid
      `;
      expect(reqRow?.response_product_id).toBe(existingDoll!.id);
      expect(reqRow?.status).toBe("accepted");

      const [prodRow] = await client<Array<{ status: string; is_custom_order: boolean; custom_request_id: string }>>`
        SELECT status, is_custom_order, custom_request_id FROM products WHERE id = ${existingDoll!.id}::uuid
      `;
      expect(prodRow?.status).toBe("reserved");
      expect(prodRow?.is_custom_order).toBe(true);
      expect(prodRow?.custom_request_id).toBe(testRequestId);

      // 5. Проверяем быструю отметку о выполнении и оплате
      const soldRes = await markResponseDollSoldAction({
        requestId: testRequestId,
        productId: existingDoll!.id,
      });
      expect(soldRes.success).toBe(true);

      const [prodSold] = await client<Array<{ status: string }>>`
        SELECT status FROM products WHERE id = ${existingDoll!.id}::uuid
      `;
      expect(prodSold?.status).toBe("sold");
    } finally {
      await client`DELETE FROM products WHERE id = ${existingDoll!.id}::uuid`;
    }
  });
});
