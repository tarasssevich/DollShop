import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiAiProvider } from "../gemini";

describe("GeminiAiProvider (Step 4.7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Offline Fallback Mode (без API-ключа)", () => {
    it("генерирует качественный авторский текст с упоминанием названия и материалов", async () => {
      const provider = new GeminiAiProvider({ apiKey: "" });

      const story = await provider.generateStory({
        title: "Селеста",
        materials: ["мятный хлопок", "резное дерево"],
        heightCm: 20,
      });

      expect(story).toContain("Селеста");
      expect(story).toContain("хлопок");
      expect(story.length).toBeGreaterThan(100);
    });

    it("возвращает более краткий текст в режиме shorter", async () => {
      const provider = new GeminiAiProvider({ apiKey: "" });

      const story = await provider.generateStory({
        title: "Селеста",
        mode: "shorter",
      });

      expect(story).toContain("Селеста");
      expect(story.length).toBeLessThan(350);
    });

    it("возвращает уютный домашний текст в режиме warmer", async () => {
      const provider = new GeminiAiProvider({ apiKey: "" });

      const story = await provider.generateStory({
        title: "Селеста",
        mode: "warmer",
      });

      expect(story).toContain("Селеста");
      expect(story).toContain("тепло");
    });
  });

  describe("Live Gemini API Mode (с API-ключом)", () => {
    it("отправляет POST запрос к модели Gemini и возвращает сгенерированный текст", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "Тихая утренняя фея Селеста появилась на свет на рассвете...",
                  },
                ],
              },
            },
          ],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const provider = new GeminiAiProvider({
        apiKey: "AIzaSyFakeTestKey123",
        model: "gemini-1.5-pro",
      });

      const story = await provider.generateStory({
        title: "Селеста",
        materials: ["хлопок"],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("gemini-1.5-pro:generateContent?key=AIzaSyFakeTestKey123");
      expect(options.method).toBe("POST");

      expect(story).toBe("Тихая утренняя фея Селеста появилась на свет на рассвете...");
    });

    it("выбрасывает понятную ошибку на русском при ошибке доступа (403)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          text: async () => "Forbidden",
        })
      );

      const provider = new GeminiAiProvider({ apiKey: "invalid-key" });

      await expect(
        provider.generateStory({ title: "Селеста" })
      ).rejects.toThrow(/Ошибка доступа к Gemini API/);
    });

    it("выбрасывает понятную ошибку на русском при превышении лимита запросов (429)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          text: async () => "Rate limit exceeded",
        })
      );

      const provider = new GeminiAiProvider({ apiKey: "test-key" });

      await expect(
        provider.generateStory({ title: "Селеста" })
      ).rejects.toThrow(/Превышен лимит запросов к AI/);
    });
  });
});
