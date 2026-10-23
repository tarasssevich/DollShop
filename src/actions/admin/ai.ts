"use server";

import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/guard";
import { getAiProvider } from "@/lib/ai/gemini";

const generateStorySchema = z.object({
  title: z
    .string({ required_error: "Название куклы обязательно для сочинения истории" })
    .min(2, "Название куклы должно содержать минимум 2 символа")
    .max(120, "Название слишком длинное"),
  materials: z.array(z.string()).optional().default([]),
  heightCm: z.number().int().positive().optional(),
  collection: z.string().optional(),
  notes: z.string().max(500, "Заметки мастера слишком длинные").optional(),
  mode: z
    .enum(["default", "shorter", "warmer", "alternative"])
    .optional()
    .default("default"),
  currentStory: z.string().optional(),
});

export type GenerateStoryInput = z.infer<typeof generateStorySchema>;

export type GenerateStoryResult =
  | { success: true; story: string }
  | { success: false; error: string };

// Простой in-memory rate-limiter: не более 15 генераций в минуту на сессию
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  if (!userRate || now > userRate.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }

  if (userRate.count >= 15) {
    return false;
  }

  userRate.count++;
  return true;
}

/**
 * Server Action генерации художественной истории куклы через Gemini 1.5 Pro.
 */
export async function generateDollStoryAction(
  input: unknown
): Promise<GenerateStoryResult> {
  const session = await requireAdminAction();

  if (!checkAiRateLimit(session.user.id)) {
    return {
      success: false,
      error: "Слишком много запросов к AI. Пожалуйста, подождите минуту перед повторной генерацией.",
    };
  }

  const parsed = generateStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const provider = getAiProvider();
    const story = await provider.generateStory(parsed.data);
    return { success: true, story };
  } catch (err) {
    console.error("Ошибка при генерации истории:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Не удалось сгенерировать историю. Попробуйте еще раз.",
    };
  }
}
