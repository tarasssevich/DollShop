import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDollStoryAction } from "../ai";
import * as guardModule from "@/lib/auth/guard";
import * as geminiModule from "@/lib/ai/gemini";

describe("Admin AI Server Actions (Step 4.7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("отклоняет вызов без авторизации администратора", async () => {
    vi.spyOn(guardModule, "requireAdminAction").mockRejectedValueOnce(
      new Error("Доступ запрещен: требуется сессия мастера")
    );

    await expect(
      generateDollStoryAction({
        title: "Селеста",
      })
    ).rejects.toThrow(/Доступ запрещен/);
  });

  it("отклоняет вызов с пустым названием куклы", async () => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
      session: { id: "session-id", userId: "admin-id" },
    } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

    const res = await generateDollStoryAction({
      title: "",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/минимум 2 символа/);
    }
  });

  it("успешно генерирует историю куклы для авторизованного мастера", async () => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
      session: { id: "session-id", userId: "admin-id" },
    } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

    vi.spyOn(geminiModule, "getAiProvider").mockReturnValue({
      generateStory: vi.fn().mockResolvedValue("Сказка о лесной фее Селесте..."),
    });

    const res = await generateDollStoryAction({
      title: "Селеста",
      materials: ["мятный хлопок"],
      heightCm: 20,
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.story).toBe("Сказка о лесной фее Селесте...");
    }
  });
});
