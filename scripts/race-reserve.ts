import { client } from "../src/db/client";
import { reserveProduct, releaseReservation } from "../src/db/functions";

async function runRaceTest(): Promise<void> {
  console.log("🏁 Запуск стресс-теста: 200 параллельных запросов бронирования...");

  // 1. Создаем тестовую куклу со статусом 'available'
  const testSlug = `race-fairy-${Date.now()}`;
  const [created] = await client<Array<{ id: string; slug: string }>>`
    INSERT INTO products (slug, title, story, specs, price, currency, status)
    VALUES (
      ${testSlug},
      'Фея для стресс-теста гонки',
      'Проверка row-level locks при дропе',
      '{"height_cm": 20, "materials": ["хлопок"]}'::jsonb,
      55.00,
      'BYN',
      'available'
    )
    RETURNING id, slug;
  `;

  if (!created) {
    throw new Error("Не удалось создать тестовую куклу");
  }

  const productId = created.id;
  console.log(`✨ Создана кукла id=${productId}, slug=${created.slug}`);

  // 2. Генерируем 200 параллельных запросов от разных покупателей
  const CONCURRENT_REQUESTS = 200;
  const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) => {
    const tokenHash = `shopper_token_hash_${idx}_${Date.now()}`;
    return reserveProduct(productId, tokenHash, 15).then((res) => ({
      index: idx,
      tokenHash,
      res,
    }));
  });

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const duration = Date.now() - startTime;

  const successes = results.filter((r) => r.res.status === "SUCCESS");
  const failures = results.filter((r) => r.res.status === "ERROR");

  console.log(`⏱️ 200 транзакций выполнены за ${duration} мс (в среднем ${(duration / CONCURRENT_REQUESTS).toFixed(2)} мс/запрос)`);
  console.log(`🟢 Успешных броней: ${successes.length}`);
  console.log(`🔴 Отклоненных броней (ALREADY_RESERVED): ${failures.length}`);

  if (successes.length !== 1) {
    throw new Error(
      `❌ КРИТИЧЕСКАЯ ОШИБКА ГОНКИ: Ожидался ровно 1 победитель, получено: ${successes.length}`
    );
  }

  const winner = successes[0]!;
  console.log(`🏆 Победитель: покупатель #${winner.index} (токен: ${winner.tokenHash.slice(0, 20)}...)`);

  // 3. Проверяем идемпотентность для победителя
  console.log("🔄 Проверка идемпотентности: повторный запрос с тем же токеном...");
  const idempotentRes = await reserveProduct(productId, winner.tokenHash, 15);
  if (idempotentRes.status !== "SUCCESS") {
    throw new Error("❌ Ошибка идемпотентности: победитель не смог подтвердить свою же бронь");
  }
  console.log("✅ Идемпотентность подтверждена: тот же токен успешно возвращает бронь!");

  // 4. Проверяем освобождение брони и повторную продажу
  console.log("🔓 Освобождение брони через release_reservation...");
  const released = await releaseReservation(productId, winner.tokenHash);
  if (!released) {
    throw new Error("❌ Не удалось освободить бронь");
  }
  console.log("✅ Бронь освобождена. Проверяем возможность повторного бронирования...");

  const newToken = `new_shopper_${Date.now()}`;
  const reReserveRes = await reserveProduct(productId, newToken, 15);
  if (reReserveRes.status !== "SUCCESS") {
    throw new Error("❌ После освобождения кукла не доступна для повторной брони");
  }
  console.log("✅ Кукла успешно забронирована новым покупателем после освобождения!");

  // Очистка тестовых данных
  await client`DELETE FROM products WHERE id = ${productId}::uuid`;
  console.log("🧹 Тестовые данные удалены.");
  console.log("🎉 СТРЕСС-ТЕСТ 200 ПАРАЛЛЕЛЬНЫХ ЗАПРОСОВ БРОНИ УСПЕШНО ПРОЙДЕН!");
}

runRaceTest()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await client.end();
    process.exit(1);
  });
