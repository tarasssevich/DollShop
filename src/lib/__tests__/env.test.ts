import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv, envSchema, resetEnvCache } from "../env";

describe("env configuration validation (Step 3.1)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvCache();
  });

  it("успешно валидирует корректную конфигурацию с полным набором переменных", () => {
    const valid = {
      DATABASE_URL:
        "postgres://dollshop_app:dollshop_dev_password@localhost:5432/dollshop",
      DATABASE_MAX_CONNECTIONS: "15",
      NEXT_PUBLIC_APP_URL: "https://dollshop.by",
      NODE_ENV: "production",
      CRON_SECRET: "strong_production_cron_secret_12345",
      PGHOST: "/tmp",
      PGPORT: "5433",
    };

    const parsed = validateEnv(valid);
    expect(parsed.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(parsed.DATABASE_MAX_CONNECTIONS).toBe(15);
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("https://dollshop.by");
    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.CRON_SECRET).toBe("strong_production_cron_secret_12345");
    expect(parsed.PGHOST).toBe("/tmp");
    expect(parsed.PGPORT).toBe(5433);
  });

  it("применяет разумные дефолты при минимально необходимой конфигурации", () => {
    const minimal = {
      DATABASE_URL: "postgresql://user:pass@127.0.0.1:5432/db",
    };

    const parsed = validateEnv(minimal);
    expect(parsed.DATABASE_URL).toBe(minimal.DATABASE_URL);
    expect(parsed.DATABASE_MAX_CONNECTIONS).toBe(10);
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(parsed.CRON_SECRET).toBe("dev_cron_secret_dollshop_local");
  });

  it("выбрасывает понятную ошибку на русском языке при отсутствии DATABASE_URL", () => {
    expect(() => validateEnv({})).toThrowError(
      /Обязательная переменная|DATABASE_URL обязательна/i
    );
  });

  it("выбрасывает ошибку, если протокол DATABASE_URL не postgres:// или postgresql://", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "mysql://user:pass@localhost:3306/db",
      })
    ).toThrowError(/DATABASE_URL должна начинаться с postgres:\/\/ или postgresql:\/\//i);
  });

  it("корректно обрабатывает некорректное число соединений, откатываясь на дефолт 10", () => {
    const parsed = validateEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      DATABASE_MAX_CONNECTIONS: "not-a-number",
    });
    expect(parsed.DATABASE_MAX_CONNECTIONS).toBe(10);
  });

  it("валидирует схему напрямую через envSchema.safeParse", () => {
    const res = envSchema.safeParse({});
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes("DATABASE_URL"));
      expect(issue).toBeDefined();
    }
  });
});
