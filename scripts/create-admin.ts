import { db, client } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * CLI-скрипт создания или сброса пароля мастера-администратора магазина.
 * Использование:
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/create-admin.ts [email] [password] [name]
 */
async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || "master@dollshop.by").toLowerCase().trim();
  const password = args[1] || "DollShopMaster2026!Secure";
  const name = args[2] || "Анастасия Прокопенко (Мастер)";

  console.log(`🔐 Инициализация учетной записи мастера: ${email}...`);

  try {
    // Проверяем, существует ли пользователь
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (existing) {
      console.log(`⚠️ Пользователь с email ${email} уже существует.`);
      console.log(`🔄 Обновление пароля через Better Auth API...`);
      // Удаляем старого и создаем заново с новым хэшем пароля
      await db.delete(user).where(eq(user.id, existing.id));
    }

    const created = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!created?.user) {
      throw new Error("Не удалось создать учетную запись мастера");
    }

    // Убеждаемся, что роль установлена в admin
    await db
      .update(user)
      .set({ role: "admin", emailVerified: true })
      .where(eq(user.email, email));

    console.log("✅ Учётная запись мастера успешно настроена!");
    console.log(`   Email:    ${email}`);
    console.log(`   Пароль:   ${password}`);
    console.log(`   Имя:      ${name}`);
    console.log(`   Роль:     admin`);
    console.log(`\n👉 Теперь вы можете войти в админку по адресу: /admin/login`);
  } catch (err) {
    console.error("❌ Ошибка при создании учетной записи мастера:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
