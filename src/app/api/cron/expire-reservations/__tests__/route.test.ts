import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import * as functionsModule from "@/db/functions";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Cron: /api/cron/expire-reservations (Step 7.1)", () => {
  const validSecret = process.env.CRON_SECRET || "dev_cron_secret_dollshop_local";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("возвращает 401 Unauthorized, если CRON_SECRET не передан", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/expire-reservations", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Доступ запрещен");
  });

  it("возвращает 401 Unauthorized, если передан неверный CRON_SECRET", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/expire-reservations", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong_secret_123456",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("успешно выполняет процедуру при корректном Bearer токене и возвращает список освобождённых кукол", async () => {
    vi.spyOn(functionsModule, "expireReservations").mockResolvedValue([
      { productId: "p-uuid-1", slug: "selesta-feya" },
      { productId: "p-uuid-2", slug: "liza-v-lunnom-svete" },
    ]);

    const req = new NextRequest("http://localhost:3000/api/cron/expire-reservations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${validSecret}`,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.expiredCount).toBe(2);
    expect(data.expired.length).toBe(2);
    expect(data.expired[0]?.slug).toBe("selesta-feya");
  });

  it("поддерживает авторизацию через кастомный заголовок x-cron-secret", async () => {
    vi.spyOn(functionsModule, "expireReservations").mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/cron/expire-reservations", {
      method: "POST",
      headers: {
        "x-cron-secret": validSecret,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.expiredCount).toBe(0);
  });

  it("поддерживает GET-запрос с query-параметром ?secret=...", async () => {
    vi.spyOn(functionsModule, "expireReservations").mockResolvedValue([]);

    const req = new NextRequest(
      `http://localhost:3000/api/cron/expire-reservations?secret=${validSecret}`,
      { method: "GET" }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
