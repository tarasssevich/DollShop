import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, client } from "./client";

/**
 * Программный запуск всех миграций Drizzle ORM для DollShop.
 */
export async function runMigrations(): Promise<void> {
  console.log("⏳ Применение миграций Drizzle для DollShop...");
  const startTime = Date.now();
  await migrate(db, { migrationsFolder: "./drizzle" });
  const duration = Date.now() - startTime;
  console.log(`✅ Миграции успешно применены за ${duration} мс!`);
}

// Запуск напрямую через CLI: npx tsx src/db/migrate.ts
if (
  process.env.NODE_ENV !== "test" &&
  (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js"))
) {
  runMigrations()
    .then(async () => {
      await client.end();
      process.exit(0);
    })
    .catch(async (err: unknown) => {
      console.error("❌ Ошибка применения миграций:", err);
      await client.end();
      process.exit(1);
    });
}
