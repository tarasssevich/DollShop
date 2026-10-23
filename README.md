# 🧚 DollShop — Авторские куклы-феи ручной работы

Высоконагруженный арт-бутик и онлайн-витрина авторских интерьерных текстильных кукол-фей и ангелов ручной работы (Республика Беларусь).

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat)](https://orm.drizzle.team/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-69_tests_passing-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)

---

## 🌸 О проекте

- **Концепция изделий:** авторские текстильные куклы-феи и ангелы ручной работы. Каждая кукла уникальна: натуральная пряжа макраме из эко-хлопка, полированные бусины из светлого бука/березы, лазерные крылья бабочек, невесомый фатин с вышитыми ромашками и микро-букетики незабудок.
- **Ценовой сегмент:** 45–65 BYN (доступные авторские подарки и декор).
- **Юрисдикция и рынок:** Республика Беларусь, валюта `BYN`, получение заказов: отправка почтой по Беларуси или самовывоз в Минске.
- **Соответствие законодательству РБ:** Указ № 60 (домен `.by`, хостинг и БД в ЦОД Беларуси), Закон № 99-З «О защите персональных данных», ст. 405, 407 ГК РБ (публичная оферта).

---

## 🛠 Технологический стек

- **Фреймворк:** [Next.js 16.4.2 (App Router, Turbopack)](https://nextjs.org/) + React 19
- **Стилизация и шрифты:** Tailwind CSS v4, палитра арт-бутика (*Alabaster, Linen, Terracotta, Sage, Espresso*), шрифты *Cormorant Garamond* (заголовки) и *Manrope* (интерфейс)
- **Компоненты:** Radix UI, Lucide Icons, Sonner
- **База данных:** PostgreSQL 18 (Alpine, `Europe/Minsk`), драйвер `postgres.js`
- **ORM:** Drizzle ORM + Drizzle Kit
- **Безопасность:** Zero-Trust DevTools Protection, `server-only` изоляция секретов, UUIDv4 публичные токены заказов, атомарные функции брони в БД (`reserve_product`), Honeypot-ловушки и Rate-limiting
- **ИИ-генератор историй:** Google Gemini 1.5 Pro (подписка Google AI Pro) через Cloudflare Worker proxy
- **Уведомления и управление:** Telegram Bot API с интерактивными Inline-кнопками для подтверждения продаж в 1 клик

---

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install --legacy-peer-deps
```

### 2. Настройка переменных окружения
Скопируйте пример файла конфигурации:
```bash
cp .env.example .env.local
```
Переменные строго валидируются через Zod (`src/lib/env.ts`).

### 3. Запуск базы данных
```bash
# Docker Compose (PostgreSQL 18)
docker compose up -d
```

### 4. Запуск сервера разработки
```bash
npm run dev
# Открыть http://localhost:3000 (или 0.0.0.0:3001 для тестирования со смартфона)
```

---

## 🧪 Скрипты качества и тестирования

```bash
# Запуск тестов Vitest (unit & integration)
npm test

# Строгая проверка типов TypeScript
npm run typecheck

# Линтинг кода (ESLint 9)
npm run lint

# Сборка и статическая генерация Next.js SSG
npm run build

# Управление базой данных Drizzle
npm run db:generate   # генерация миграций
npm run db:migrate    # применение миграций
npm run db:push       # push схемы
npm run db:studio     # запуск веб-интерфейса Drizzle Studio
```

---

## 📚 Документация проекта

- [**ROADMAP.md**](./ROADMAP.md) — дорожная карта проекта (7 фаз, статусы шагов, DoD и принятые решения).
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — детальная архитектура системы, модель данных, защита от DevTools и законы РБ.
- [**AGENTS.md**](./AGENTS.md) — правила разработки и непреложный закон синхронизации решений в файлы.
