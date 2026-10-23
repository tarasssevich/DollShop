import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

/**
 * Программный запуск всех миграций Drizzle ORM для DollShop.
 * Для выполнения DDL-миграций используется роль app_owner (DATABASE_OWNER_URL),
 * если она настроена, либо основная DATABASE_URL.
 */
export async function runMigrations(): Promise<void> {
  const connectionUrl = env.DATABASE_OWNER_URL || env.DATABASE_URL;
  console.log("⏳ Применение миграций Drizzle для DollShop...");
  const startTime = Date.now();

  const migrationClient = postgres(connectionUrl, {
    max: 1,
    ...(env.PGHOST ? { host: env.PGHOST } : {}),
    ...(env.PGPORT ? { port: env.PGPORT } : {}),
  });

  const migrationDb = drizzle(migrationClient);

  try {
    await migrate(migrationDb, { migrationsFolder: "./drizzle" });
    const duration = Date.now() - startTime;
    console.log(`✅ Миграции успешно применены за ${duration} мс!`);
  } finally {
    await migrationClient.end();
  }
}

// Запуск напрямую через CLI: npx tsx src/db/migrate.ts
if (
  process.env.NODE_ENV !== "test" &&
  (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js"))
) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error("❌ Ошибка применения миграций:", err);
      process.exit(1);
    });
}
