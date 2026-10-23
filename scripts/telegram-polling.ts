/**
 * Telegram Long Polling Worker для локальной разработки и тестирования (Step 5.3)
 * Позволяет кнопкам в Telegram боте работать на localhost без необходимости настраивать публичный туннель / домен.
 *
 * Запуск:
 *   npm run tg:poll
 */

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
  };
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const port = process.env.PORT || "3001";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  if (!token) {
    console.error("❌ Ошибка: TELEGRAM_BOT_TOKEN не задан в .env.local");
    process.exit(1);
  }

  console.log("🤖 Запуск Telegram Long Polling Worker для DollShop...");
  console.log(`🔗 Локальный эндпоинт приложения: ${webhookUrl}`);

  // Проверяем информацию о боте
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = (await meRes.json()) as { ok: boolean; result?: { username: string; first_name: string } };
    if (!meData.ok || !meData.result) {
      console.error("❌ Не удалось подключиться к Telegram Bot API. Проверьте токен.");
      process.exit(1);
    }
    console.log(`✅ Подключено к боту: @${meData.result.username} (${meData.result.first_name})`);
  } catch (err) {
    console.error("❌ Ошибка соединения с api.telegram.org:", err);
    process.exit(1);
  }

  // Проверяем, не установлен ли сторонний вебхук
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as { ok: boolean; result?: { url: string } };
    if (whData.ok && whData.result?.url) {
      console.log(`⚠️ Обнаружен установленный вебхук: ${whData.result.url}`);
      console.log("ℹ️ Для работы Long Polling вебхук будет временно сброшен...");
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
      console.log("✅ Вебхук успешно сброшен, переходим в режим Long Polling.");
    }
  } catch (err) {
    console.warn("⚠️ Не удалось проверить статус вебхука:", err);
  }

  console.log("⏳ Ожидание нажатий на кнопки в Telegram боте... (нажмите Ctrl+C для выхода)");

  let offset = 0;
  let isRunning = true;

  process.on("SIGINT", () => {
    console.log("\n🛑 Остановка Telegram Polling Worker...");
    isRunning = false;
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    isRunning = false;
    process.exit(0);
  });

  while (isRunning) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`,
        { signal: AbortSignal.timeout(30000) }
      );

      if (!response.ok) {
        console.error(`Ошибка Telegram getUpdates (${response.status})`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      const data = (await response.json()) as {
        ok: boolean;
        result?: TelegramUpdate[];
      };

      if (!data.ok || !Array.isArray(data.result)) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      for (const update of data.result) {
        offset = Math.max(offset, update.update_id + 1);

        if (update.callback_query) {
          const cb = update.callback_query;
          console.log(
            `\n🔘 [Telegram Action] Нажата кнопка "${cb.data}" от пользователя ${cb.from.id} (${cb.from.first_name || ""})`
          );

          try {
            const forwardRes = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}),
              },
              body: JSON.stringify(update),
            });

            const forwardResult = await forwardRes.json().catch(() => ({}));
            if (forwardRes.ok) {
              console.log("✅ Действие успешно обработано вебхуком:", forwardResult);
            } else {
              console.error(`❌ Вебхук вернул статус ${forwardRes.status}:`, forwardResult);
            }
          } catch (err) {
            console.error("❌ Ошибка при отправке на локальный вебхук приложения:", err);
          }
        } else if (update.message?.text === "/start") {
          console.log(`💬 Получена команда /start от ${update.message.chat.id}`);
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}),
              },
              body: JSON.stringify(update),
            });
          } catch (err) {
            console.error("Ошибка при пересылке /start:", err);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "TimeoutError") {
        console.error("Ошибка цикла опроса Telegram:", err);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

main().catch(console.error);
