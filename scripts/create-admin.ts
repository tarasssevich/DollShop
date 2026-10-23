import { db, client } from "@/db/client";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

/**
 * CLI-скрипт создания или сброса пароля мастера-администратора магазина.
 * Работает напрямую с базой данных, независимо от настройки disableSignUp: true.
 *
 * Использование:
 *   npm run auth:create-admin [email] [password] [name]
 */
async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || "master@dollshop.by").toLowerCase().trim();
  const password = args[1] || "DollMaster2026!";
  const name = args[2] || "Анастасия Прокопенко (Мастер)";

  console.log(`🔐 Инициализация учетной записи мастера: ${email}...`);

  try {
    const hashedPassword = await hashPassword(password);

    // Проверяем, существует ли пользователь
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    let userId: string;

    if (existing) {
      console.log(`⚠️ Пользователь с email ${email} уже существует.`);
      console.log(`🔄 Обновление пароля и роли...`);
      userId = existing.id;

      await db
        .update(user)
        .set({
          name,
          role: "admin",
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      // Обновляем или вставляем запись в account
      const [existingAccount] = await db
        .select()
        .from(account)
        .where(eq(account.userId, userId));

      if (existingAccount) {
        await db
          .update(account)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(account.id, existingAccount.id));
      } else {
        await db.insert(account).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
        });
      }
    } else {
      userId = crypto.randomUUID();

      await db.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        role: "admin",
      });

      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashedPassword,
      });
    }

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
