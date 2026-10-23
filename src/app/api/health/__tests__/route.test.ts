import { describe, it, expect, vi } from "vitest";
import { GET } from "../route";
import * as dbModule from "@/db/client";

describe("Health Check: /api/health (Step 7.1)", () => {
  it("возвращает 200 OK со статусом 'healthy' и метриками базы данных", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("dollshop-web");
    expect(data.database.status).toBe("connected");
    expect(typeof data.database.latencyMs).toBe("number");
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(data.system.nodeVersion).toBeDefined();
  });

  it("возвращает 503 Service Unavailable, если соединение с базой данных оборвалось", async () => {
    const spy = vi
      .spyOn(dbModule, "client")
      .mockRejectedValueOnce(new Error("Connection refused (ECONNREFUSED)"));

    const res = await GET();
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.status).toBe("unhealthy");
    expect(data.database.status).toBe("disconnected");
    expect(data.database.error).toContain("Connection refused");

    spy.mockRestore();
  });
});
