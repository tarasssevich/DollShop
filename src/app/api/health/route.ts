import { NextResponse } from "next/server";
import { client } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Проверка соединения с PostgreSQL
    const [dbResult] = await client<
      Array<{ alive: number; current_time: Date }>
    >`SELECT 1 as alive, NOW() as current_time;`;

    const dbLatencyMs = Date.now() - startTime;
    const memUsage = process.memoryUsage();

    if (!dbResult || dbResult.alive !== 1) {
      throw new Error("База данных не вернула ожидаемый сигнал жизнеспособности");
    }

    const serverTime =
      dbResult.current_time instanceof Date
        ? dbResult.current_time.toISOString()
        : new Date(dbResult.current_time).toISOString();

    return NextResponse.json(
      {
        status: "healthy",
        service: "dollshop-web",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
          serverTime,
        },
        system: {
          nodeVersion: process.version,
          memoryRssMb: Math.round(memUsage.rss / 1024 / 1024),
          memoryHeapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
          environment: process.env.NODE_ENV || "development",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";

    console.error("Health check failure:", err);

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "dollshop-web",
        timestamp: new Date().toISOString(),
        durationMs,
        database: {
          status: "disconnected",
          error: errorMessage,
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
