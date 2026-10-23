import "server-only";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

declare global {
  var __dollshop_sql__: ReturnType<typeof postgres> | undefined;
  var __dollshop_db__: PostgresJsDatabase | undefined;
}

/**
 * Пул соединений PostgreSQL 18 через драйвер postgres.js.
 * Конфигурируется через строго валидированный env.
 */
function createSqlClient(): ReturnType<typeof postgres> {
  const options: NonNullable<Parameters<typeof postgres>[1]> = {
    max: env.DATABASE_MAX_CONNECTIONS,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
  };

  if (env.PGHOST) {
    options.host = env.PGHOST;
  }
  if (env.PGPORT) {
    options.port = env.PGPORT;
  }

  return postgres(env.DATABASE_URL, options);
}

export const client: ReturnType<typeof postgres> =
  globalThis.__dollshop_sql__ ?? createSqlClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__dollshop_sql__ = client;
}

/**
 * Экземпляр Drizzle ORM для DollShop.
 */
export const db: PostgresJsDatabase =
  globalThis.__dollshop_db__ ?? drizzle(client);

if (process.env.NODE_ENV !== "production") {
  globalThis.__dollshop_db__ = db;
}
