import { env } from "@/lib/env";
import { buildDollStoryPrompt, type DollStoryPromptInput } from "./prompts";

export interface AiProvider {
  generateStory(options: DollStoryPromptInput): Promise<string>;
}

export class GeminiAiProvider implements AiProvider {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = config?.apiKey || env.GEMINI_API_KEY;
    this.baseUrl = (
      config?.baseUrl ||
      env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com"
    ).replace(/\/+$/, "");
    this.model = config?.model || env.GEMINI_MODEL || "gemini-1.5-pro";
  }

  async generateStory(options: DollStoryPromptInput): Promise<string> {
    const { systemPrompt, userPrompt } = buildDollStoryPrompt(options);

    // Если API ключ ещё не настроен в окружении (локальная разработка или оффлайн-тесты),
    // возвращаем красивый адаптивный авторский текст, чтобы не блокировать работу мастера
    if (!this.apiKey) {
      return this.generateOfflineFallback(options);
    }

    const endpoint = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.78,
            maxOutputTokens: 700,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", response.status, errorBody);

        if (response.status === 400) {
          throw new Error("Некорректный запрос к модели Gemini");
        } else if (response.status === 403) {
          throw new Error(
            "Ошибка доступа к Gemini API (проверьте API-ключ мастера или настройки прокси)"
          );
        } else if (response.status === 429) {
          throw new Error(
            "Превышен лимит запросов к AI. Пожалуйста, подождите минуту."
          );
        }

        throw new Error(`Ошибка AI-генератора (код ${response.status})`);
      }

      const data = await response.json();
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedText) {
        throw new Error("AI вернул пустой ответ");
      }

      // Очищаем от случайных markdown-обёрток ```
      return generatedText.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "").trim();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Произошла неизвестная ошибка при генерации истории");
    }
  }

  /**
   * Генератор качественного художественного текста для сред без прямого API-ключа
   */
  private generateOfflineFallback(options: DollStoryPromptInput): string {
    const { title, materials = [], heightCm = 20, mode } = options;
    const materialsStr = materials.join(", ").toLowerCase();

    if (mode === "shorter") {
      return `«${title}» рождена в тишине утренней мастерской. В ней соединились ${materialsStr || "натуральный хлопок и тёплое дерево"}. Она хранит светлую тишину и создана, чтобы приносить в дом мир, вдохновение и нежное весеннее тепло.`;
    }

    if (mode === "warmer") {
      return `Каждая петелька куклы «${title}» хранит тепло бережных рук. Когда за окном шумит дождь или кружит первый снег, она тихо напоминает о самом главном — о доме, где тебя всегда ждут и любят.

Гладкое полированное дерево, мягкое прикосновение хлопковых нитей и крошечный букетик в ладонях — эта маленькая хранительница (ростом ${heightCm} см) создана для того, чтобы стать самым душевным талисманом домашнего очага.`;
    }

    return `Говорят, у каждой вещи ручной работы есть своё тихое дыхание. Кукла «${title}» появилась на свет словно из шелеста весеннего сада и нежных воспоминаний детства.

Её наряд сплетён из ${materialsStr || "натурального хлопка и невесомого фатина"}, а тонкие резные крылья словно готовы уловить легчайшее дуновение утреннего ветра. Она не просто интерьерная кукла, а маленькая сказочная спутница, приносящая в дом уют, радость и добрые сны.`;
  }
}

let customAiProvider: AiProvider | null = null;

export function setCustomAiProvider(provider: AiProvider | null): void {
  customAiProvider = provider;
}

export function getAiProvider(): AiProvider {
  if (customAiProvider) {
    return customAiProvider;
  }
  return new GeminiAiProvider();
}
