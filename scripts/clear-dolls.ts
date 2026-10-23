import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

const databaseUrl =
  process.env.DATABASE_OWNER_URL ||
  process.env.DATABASE_URL ||
  "postgres://app_user:dollshop_dev_password@localhost:5433/dollshop";

async function main() {
  const sql = postgres(databaseUrl);
  console.log("🧹 Запуск полной очистки тестовых данных DollShop...");

  try {
    await sql.begin(async (tx) => {
      console.log("1. Очистка заявок клиентов (custom_requests)...");
      const delReq = await tx`DELETE FROM custom_requests RETURNING id`;
      console.log(`   Удалено заявок: ${delReq.length}`);

      console.log("2. Очистка позиций заказов (order_items)...");
      const delItems = await tx`DELETE FROM order_items RETURNING id`;
      console.log(`   Удалено позиций заказов: ${delItems.length}`);

      console.log("3. Очистка заказов (orders)...");
      const delOrders = await tx`DELETE FROM orders RETURNING id`;
      console.log(`   Удалено заказов: ${delOrders.length}`);

      console.log("4. Очистка временных броней (reservations)...");
      const delRes = await tx`DELETE FROM reservations RETURNING product_id`;
      console.log(`   Удалено броней: ${delRes.length}`);

      console.log("5. Очистка медиа-файлов кукол (product_media)...");
      const delMedia = await tx`DELETE FROM product_media RETURNING id`;
      console.log(`   Удалено записей медиа: ${delMedia.length}`);

      console.log("6. Очистка каталога кукол (products)...");
      const delProducts = await tx`DELETE FROM products RETURNING id`;
      console.log(`   Удалено кукол: ${delProducts.length}`);

      console.log("7. Очистка записей rate-limiting (rate_limits)...");
      await tx`DELETE FROM rate_limits`;

      console.log("8. Очистка сессий пользователей (session)...");
      await tx`DELETE FROM session`;
    });

    console.log("9. Очистка локальных загрузок в public/uploads/...");
    const uploadsDir = path.resolve(process.cwd(), "public/uploads");
    const subdirs = ["products", "requests", "test-uploads"];

    for (const sub of subdirs) {
      const targetDir = path.join(uploadsDir, sub);
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        for (const file of files) {
          const filePath = path.join(targetDir, file);
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }
    console.log("   Локальные каталоги загрузок очищены.");

    const [pCount] = await sql`SELECT count(*) FROM products`;
    const [oCount] = await sql`SELECT count(*) FROM orders`;
    const [rCount] = await sql`SELECT count(*) FROM custom_requests`;

    console.log("========================================================================");
    console.log("🎉 Система успешно очищена от всех тестовых данных!");
    console.log(`   Кукол в каталоге:    ${pCount?.count ?? 0}`);
    console.log(`   Заказов:            ${oCount?.count ?? 0}`);
    console.log(`   Заявок:             ${rCount?.count ?? 0}`);
    console.log("   Учётная запись администратора сохранена для входа в /admin");
    console.log("   Настройки магазина сохранены для настройки в /admin/nastrojki");
    console.log("========================================================================");
  } catch (error) {
    console.error("❌ Ошибка при очистке системы:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
