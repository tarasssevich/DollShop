import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import { env } from "@/lib/env";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Route Handler /api/revalidate (Step 3.7)", () => {
  const secret = env.REVALIDATE_SECRET;

  it("возвращает 401 при отсутствии секретного токена", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ tags: ["products"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Неверный секретный ключ/i);
  });

  it("возвращает 401 при неверном секретном ключе", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "wrong_attacker_secret",
      },
      body: JSON.stringify({ tags: ["products"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("возвращает 400 если не переданы ни теги, ни пути", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Не указаны теги/i);
  });

  it("успешно ревалидирует переданные теги при валидном ключе в заголовке x-revalidate-secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags: ["products", "product:selesta"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(json.tags).toContain("products");
    expect(json.tags).toContain("product:selesta");
  });

  it("поддерживает авторизацию через Authorization: Bearer <secret>", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tag: "settings" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(json.tags).toContain("settings");
  });

  it("поддерживает GET-запрос с query параметрами ?secret=...&tag=...", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/revalidate?secret=${secret}&tag=products`
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(json.tag).toBe("products");
  });
});
