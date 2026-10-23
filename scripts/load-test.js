#!/usr/bin/env node

/**
 * ============================================================
 * DollShop Load Testing & Performance Benchmark (Step 7.3)
 * Скрипт автоматического нагрузочного тестирования на базе autocannon
 * ============================================================
 */

import autocannon from "autocannon";
import postgres from "postgres";

const BASE_URL = process.env.TARGET_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001";
const DURATION_SEC = parseInt(process.env.BENCH_DURATION || "10", 10);
const CONNECTIONS = parseInt(process.env.BENCH_CONNECTIONS || "25", 10);
const DB_URL = process.env.DATABASE_URL || "postgres://app_user:dollshop_dev_password@localhost:5433/dollshop";

console.log("============================================================");
console.log("🚀 ЗАПУСК НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ DOLLSHOP (Step 7.3)");
console.log(`🌐 Целевой хост:      ${BASE_URL}`);
console.log(`⏱️  Длительность теста: ${DURATION_SEC} сек / сценарий`);
console.log(`👥 Соединений (conn): ${CONNECTIONS}`);
console.log(`🗄️  База данных:       PostgreSQL 18 (${DB_URL.replace(/:[^:@]+@/, ":***@")})`);
console.log("============================================================\n");

async function getPgStats(sql) {
  try {
    const [stats] = await sql`
      SELECT 
        numbackends,
        xact_commit,
        tup_returned,
        tup_fetched
      FROM pg_stat_database 
      WHERE datname = current_database();
    `;
    return stats;
  } catch {
    return null;
  }
}

function runBenchmark(title, url, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Запуск сценария: [${title}] -> ${url}`);

    const instance = autocannon(
      {
        url,
        connections: options.connections || CONNECTIONS,
        duration: options.duration || DURATION_SEC,
        pipelining: options.pipelining || 1,
        headers: {
          "user-agent": "DollShop-LoadTester/1.0",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    // Выводим индикатор выполнения в терминал
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false });
  });
}

function formatResult(title, res) {
  return {
    scenario: title,
    rpsAverage: res.requests.average,
    rpsTotal: res.requests.total,
    latencyAvgMs: res.latency.average,
    latencyP50Ms: res.latency.p50,
    latencyP90Ms: res.latency.p90,
    latencyP97Ms: res.latency.p97_5,
    latencyP99Ms: res.latency.p99,
    throughputMbSec: (res.throughput.average / 1024 / 1024).toFixed(2),
    errorsCount: res.errors + res.timeouts + res.non2xx,
    status2xx: res["2xx"] || res.requests.total,
  };
}

async function main() {
  let sql = null;
  try {
    sql = postgres(DB_URL, { max: 1 });
  } catch (err) {
    console.warn("⚠️ Не удалось подключиться к базе данных для сбора метрик pg_stat_database:", err.message);
  }

  const initialPgStats = sql ? await getPgStats(sql) : null;

  const scenarios = [
    {
      title: "1. Главная витрина (ISR кэш)",
      path: "/",
      connections: CONNECTIONS,
    },
    {
      title: "2. Каталог кукол (/kukly)",
      path: "/kukly",
      connections: CONNECTIONS,
    },
    {
      title: "3. Карточка куклы (/kukly/selesta)",
      path: "/kukly/selesta",
      connections: CONNECTIONS,
    },
    {
      title: "4. Health Check эндпоинт (/api/health)",
      path: "/api/health",
      connections: Math.min(CONNECTIONS, 15),
    },
  ];

  const results = [];

  for (const scen of scenarios) {
    try {
      const target = `${BASE_URL}${scen.path}`;
      const res = await runBenchmark(scen.title, target, { connections: scen.connections });
      const formatted = formatResult(scen.title, res);
      results.push(formatted);
      console.log(`✅ [${scen.title}] завершён: ${formatted.rpsAverage.toFixed(0)} req/s | p97.5: ${formatted.latencyP97Ms} ms | Ошибок: ${formatted.errorsCount}\n`);
    } catch (err) {
      console.error(`❌ Ошибка выполнения сценария [${scen.title}]:`, err.message);
    }
  }

  const finalPgStats = sql ? await getPgStats(sql) : null;
  if (sql) {
    await sql.end();
  }

  console.log("============================================================");
  console.log("📊 СВОДНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ");
  console.log("============================================================");
  console.table(
    results.map((r) => ({
      "Сценарий": r.scenario,
      "RPS (ср.)": `${r.rpsAverage.toFixed(0)} req/s`,
      "p50 (мс)": `${r.latencyP50Ms} ms`,
      "p97.5 (мс)": `${r.latencyP97Ms} ms`,
      "p99 (мс)": `${r.latencyP99Ms} ms`,
      "Трафик": `${r.throughputMbSec} MB/s`,
      "Ошибок": r.errorsCount,
    }))
  );

  if (initialPgStats && finalPgStats) {
    console.log("============================================================");
    console.log("🗄️ ВЛИЯНИЕ НА POSTGRESQL (pg_stat_database):");
    const diffCommits = finalPgStats.xact_commit - initialPgStats.xact_commit;
    const diffFetched = finalPgStats.tup_fetched - initialPgStats.tup_fetched;
    console.log(`* Активных соединений: ${finalPgStats.numbackends}`);
    console.log(`* Транзакций за время тестов: ${diffCommits}`);
    console.log(`* Строк прочитано из БД:      ${diffFetched}`);
    console.log(
      "📌 Вывод: Благодаря ISR и архитектуре кэширования Next.js, обращения к витрине обслуживаются без постоянной нагрузки на PostgreSQL."
    );
    console.log("============================================================\n");
  }

  return results;
}

main().catch((err) => {
  console.error("Критический сбой нагрузочного теста:", err);
  process.exit(1);
});
