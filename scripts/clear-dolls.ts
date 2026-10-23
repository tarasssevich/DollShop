import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_OWNER_URL ||
  process.env.DATABASE_URL ||
  "postgres://app_user:dollshop_dev_password@localhost:5433/dollshop";

async function main() {
  const sql = postgres(databaseUrl);
  console.log("🧹 Очистка каталога кукол DollShop...");

  try {
    await sql.begin(async (tx) => {
      console.log("1. Отвязка референсов кукол в заявках custom_requests...");
      await tx`UPDATE custom_requests SET reference_product_id = NULL`;

      console.log("2. Очистка order_items...");
      await tx`DELETE FROM order_items`;

      console.log("3. Очистка orders...");
      await tx`DELETE FROM orders`;

      console.log("4. Очистка reservations...");
      await tx`DELETE FROM reservations`;

      console.log("5. Очистка product_media...");
      await tx`DELETE FROM product_media`;

      console.log("6. Очистка таблицы products (все куклы, включая архив и черновики)...");
      const deleted = await tx`DELETE FROM products RETURNING id`;
      console.log(`✅ Успешно удалено кукол: ${deleted.length}`);
    });

    const [pCount] = await sql`SELECT count(*) FROM products`;
    console.log(`🎉 Каталог кукол полностью очищен. Текущее количество кукол: ${pCount?.count ?? 0}`);
  } catch (error) {
    console.error("❌ Ошибка при очистке кукол:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
