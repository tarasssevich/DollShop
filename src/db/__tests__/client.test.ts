import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db, client } from "../client";

describe("db client and PostgreSQL 18 connectivity (Step 3.1)", () => {
  it("экспортирует инициализированный пул соединений client и экземпляр db", () => {
    expect(client).toBeDefined();
    expect(db).toBeDefined();
    expect(typeof client).toBe("function");
  });

  it("успешно выполняет тестовый запрос через postgres.js client", async () => {
    const rows = await client`
      SELECT 
        1 as ping, 
        current_database() as database, 
        current_user as user,
        version() as version
    `;

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row?.ping).toBe(1);
    expect(row?.database).toBe("dollshop");
    expect(row?.user).toBe("dollshop_app");
    expect(row?.version).toMatch(/PostgreSQL 18/i);
  });

  it("успешно выполняет запрос через Drizzle ORM db.execute", async () => {
    const result = await db.execute(
      sql`SELECT 'Drizzle + PostgreSQL 18 OK' as status, 42 as number`
    );

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    const firstRow = result[0] as { status: string; number: number };
    expect(firstRow.status).toBe("Drizzle + PostgreSQL 18 OK");
    expect(firstRow.number).toBe(42);
  });
});
