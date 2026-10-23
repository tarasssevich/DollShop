import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { env } from "@/lib/env";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Route Handler /api/revalidate (Step 3.7 - Hardened)", () => {
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

  it("возвращает 401 при неверном секретном ключе (timingSafeEqual)", async () => {
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

  it("отклоняет попытку передать секрет в URL query (?secret=...) для защиты логов", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/revalidate?secret=${secret}`,
      {
        method: "POST",
        body: JSON.stringify({ tags: ["products"] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("возвращает 400 при попытке инвалидировать неизвестный/произвольный тег", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags: ["evil_unknown_tag"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Неверный формат/i);
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
      body: JSON.stringify({ tag: "settings", path: "/kukly" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(json.tags).toContain("settings");
    expect(json.paths).toContain("/kukly");
  });
});
