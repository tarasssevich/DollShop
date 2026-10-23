import { z } from "zod";

/**
 * Схема валидации переменных окружения DollShop.
 * Строгая типизация и подробные сообщения об ошибках на русском языке.
 */
export const envSchema = z.object({
  DATABASE_URL: z
    .string({
      error:
        "Переменная окружения DATABASE_URL обязательна для подключения к PostgreSQL",
    })
    .min(1, "Переменная окружения DATABASE_URL не может быть пустой")
    .refine(
      (val) => val.startsWith("postgres://") || val.startsWith("postgresql://"),
      {
        message:
          "DATABASE_URL должна начинаться с postgres:// или postgresql://",
      }
    ),
  DATABASE_OWNER_URL: z
    .string()
    .refine(
      (val) => val.startsWith("postgres://") || val.startsWith("postgresql://"),
      {
        message:
          "DATABASE_OWNER_URL должна начинаться с postgres:// или postgresql://",
      }
    )
    .optional(),
  DATABASE_MAX_CONNECTIONS: z
    .string()
    .optional()
    .default("10")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) || parsed <= 0 ? 10 : parsed;
    }),
  PGHOST: z.string().optional(),
  PGPORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL должен быть валидным URL")
    .optional()
    .default("http://localhost:3000"),
  CRON_SECRET: z
    .string()
    .min(8, "CRON_SECRET должен содержать минимум 8 символов")
    .optional()
    .default("dev_cron_secret_dollshop_local"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Функция валидации кастомного словаря переменных (для тестов и рантайма).
 */
export function validateEnv(input: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join(".")}]: ${issue.message}`)
      .join("\n");

    const message = `❌ Ошибка валидации переменных окружения DollShop:\n${errorDetails}\nПожалуйста, проверьте файл .env.local или переменные окружения сервера.`;

    throw new Error(message);
  }

  return result.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv || process.env.NODE_ENV === "test") {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}

/**
 * Типизированный синглтон-прокси для доступа к переменным окружения.
 * Ленивая инициализация: падает с подробной ошибкой при первом обращении,
 * если отсутствует обязательная переменная (например, DATABASE_URL).
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    const validated = getEnv();
    return validated[prop as keyof Env];
  },
});
