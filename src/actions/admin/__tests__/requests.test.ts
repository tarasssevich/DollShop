import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAdminRequestsAction,
  updateAdminRequestStatusAction,
} from "../requests";
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
});
