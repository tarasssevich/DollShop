# Правила разработки проекта DollShop (для всех ИИ-агентов)

## 📌 КРИТИЧЕСКОЕ ПРАВИЛО: Обязательная фиксация всех решений в файлах проекта

Каждый ИИ-агент (Antigravity, субагенты, а также любые другие LLM-модели), работающий с этим проектом, **ОБЯЗАН** соблюдать следующее непреложное правило:

1. **Никаких решений «только на словах» в чате:**
   Любое решение, согласованное или принятое в диалоге с пользователем — будь то:
   - архитектурные или технические изменения (БД, стек, хостинг, библиотеки, API);
   - бизнес-логика (статусы кукол, правила брони, доставка, валюта);
   - юридические и регуляторные требования (РБ, оферта, ПД, налоги, Торговый реестр);
   - дизайн-система и UX (палитра, шрифты, экраны, поведение компонентов);
   - интеграции со сторонними сервисами (ИИ-провайдеры, платежи, Telegram, почта);
   **ДОЛЖНО БЫТЬ НЕМЕДЛЕННО ЗАФИКСИРОВАНО В ФАЙЛАХ ПРОЕКТА.**

2. **Обязательные файлы для синхронизации:**
   - [**`ARCHITECTURE.md`**](file:///home/ofi/DollShop/ARCHITECTURE.md): актуализировать описание системы, архитектурные схемы, модель данных, стек, бюджет или переменные окружения.
   - [**`ROADMAP.md`**](file:///home/ofi/DollShop/ROADMAP.md): обновить описания затронутых шагов, файлы, критерии приемки (Definition of Done) и статус в таблице «Решения и открытые вопросы» (перевести в статус «Принято»).

3. **Контекст чата смертен — файлы вечны:**
   Контекстное окно чата имеет свойство сжиматься, сбрасываться или передаваться другим агентам. Единственный источник правды для проекта — его файлы в репозитории. Если решение не зафиксировано в файле — для проекта его не существует.

---

## 🛠 Общие инженерные правила проекта
- **Язык и локализация:** Весь пользовательский интерфейс, формы, уведомления, валидация и сообщения об ошибках — строго на русском языке.
- **Типизация:** TypeScript в строгом режиме (`strict`, `noUncheckedIndexedAccess`), никаких `any` (`@typescript-eslint/no-explicit-any: error`).
- **Схема и данные:** Единственный источник правды о наличии товара — атомарные функции в PostgreSQL (`reserve_product`). Никаких проверок наличия только на клиенте.
- **Подход к разработке:** Пошаговое выполнение по [ROADMAP.md](file:///home/ofi/DollShop/ROADMAP.md) — один шаг за итерацию, с проверкой в браузере/терминале и фиксацией коммитом.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
