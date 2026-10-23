import { describe, it, expect, afterAll } from "vitest";
import postgres from "postgres";
import { env } from "@/lib/env";

describe("Database Roles and Security Privileges (Step 3.3)", () => {
  // Клиент под runtime-пользователем приложения (app_user)
  const appUserClient = postgres(env.DATABASE_URL, {
    max: 1,
    ...(env.PGHOST ? { host: env.PGHOST } : {}),
    ...(env.PGPORT ? { port: env.PGPORT } : {}),
  });

  // Клиент под владельцем схемы и мигратором (app_owner)
  const appOwnerClient = postgres(
    env.DATABASE_OWNER_URL ||
      "postgres://app_owner:dollshop_owner_password@localhost:5433/dollshop",
    {
      max: 1,
      ...(env.PGHOST ? { host: env.PGHOST } : {}),
      ...(env.PGPORT ? { port: env.PGPORT } : {}),
    }
  );

  afterAll(async () => {
    await appUserClient.end();
    await appOwnerClient.end();
  });

  it("подтверждает корректность ролей app_user и app_owner", async () => {
    const [userRes] = await appUserClient`SELECT current_user, current_database()`;
    expect(userRes?.current_user).toBe("app_user");
    expect(userRes?.current_database).toBe("dollshop");

    const [ownerRes] = await appOwnerClient`SELECT current_user, current_database()`;
    expect(ownerRes?.current_user).toBe("app_owner");
    expect(ownerRes?.current_database).toBe("dollshop");
  });

  it("app_user успешно выполняет DML операции (SELECT, INSERT, UPDATE, DELETE)", async () => {
    const testSlug = `role-test-${Date.now()}`;

    // 1. INSERT
    const [inserted] = await appUserClient`
      INSERT INTO products (slug, title, story, specs, price, currency, status)
      VALUES (${testSlug}, 'Тестовая кукла для прав', 'История', '{"height_cm": 15, "materials": ["хлопок"]}'::jsonb, 45.00, 'BYN', 'available')
      RETURNING id, slug, title
    `;
    expect(inserted?.slug).toBe(testSlug);

    // 2. SELECT
    const selected = await appUserClient`
      SELECT id, slug, title FROM products WHERE slug = ${testSlug}
    `;
    expect(selected).toHaveLength(1);

    // 3. UPDATE
    const [updated] = await appUserClient`
      UPDATE products SET title = 'Обновлено app_user' WHERE slug = ${testSlug} RETURNING title
    `;
    expect(updated?.title).toBe("Обновлено app_user");

    // 4. DELETE
    const deleted = await appUserClient`
      DELETE FROM products WHERE slug = ${testSlug} RETURNING id
    `;
    expect(deleted).toHaveLength(1);
  });

  it("app_user НЕ ИМЕЕТ ПРАВ на DROP TABLE (защита от деструктивного DDL)", async () => {
    let error: unknown = null;
    try {
      await appUserClient`DROP TABLE products`;
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    const pgError = error as { code?: string; message?: string };
    // 42501 = insufficient_privilege
    expect(pgError.code).toBe("42501");
    expect(pgError.message).toMatch(/must be owner of table|permission denied/i);
  });

  it("app_user НЕ ИМЕЕТ ПРАВ на ALTER TABLE", async () => {
    let error: unknown = null;
    try {
      await appUserClient`ALTER TABLE products ADD COLUMN malicious_col text`;
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    const pgError = error as { code?: string; message?: string };
    expect(pgError.code).toBe("42501");
    expect(pgError.message).toMatch(/must be owner of table|permission denied/i);
  });

  it("app_user НЕ ИМЕЕТ ПРАВ на TRUNCATE TABLE", async () => {
    let error: unknown = null;
    try {
      await appUserClient`TRUNCATE TABLE products`;
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    const pgError = error as { code?: string; message?: string };
    expect(pgError.code).toBe("42501");
    expect(pgError.message).toMatch(/permission denied for table products/i);
  });

  it("app_user НЕ ИМЕЕТ ПРАВ на создание новых таблиц в схеме public", async () => {
    let error: unknown = null;
    try {
      await appUserClient`CREATE TABLE public.unauthorized_table (id int)`;
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    const pgError = error as { code?: string; message?: string };
    expect(pgError.code).toBe("42501");
    expect(pgError.message).toMatch(/permission denied for schema public/i);
  });

  it("app_owner владеет всеми таблицами схемы public", async () => {
    const tables = await appOwnerClient`
      SELECT tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    expect(tables.length).toBeGreaterThan(0);
    for (const t of tables) {
      expect(t.tableowner).toBe("app_owner");
    }
  });
});
