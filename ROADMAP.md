# ROADMAP.md — DollShop (OOAK Art Boutique & Gallery)

> Пошаговый план. Каждый шаг — **одна итерация**: делаем → проверяем в браузере или терминале → коммит → следующий шаг.
> Архитектура и обоснования — в [ARCHITECTURE.md](./ARCHITECTURE.md).
>
> **Ред. 2** — адаптация под Беларусь: хостинг и БД в РБ (Указ № 60), BYN, Европочта, только русский язык, терракотовый акцент.

**Порядок фаз:** визуал → данные → админка и медиа → продажи → онлайн-оплата → инфраструктура и запуск.
**Бюджет:** Фазы 1–6 — 0 BYN (всё локально в Docker). Платим только с Фазы 7.

**Definition of Done для любого шага:**
`npm run typecheck` ✅ · `npm run lint` ✅ · нет `any` · проверено на 375px и 1440px · все тексты на русском · коммит.

---

## Прогресс

| Фаза | Название | Шаги | Статус |
|---|---|---|---|
| 1 | Фундамент, нейминг и дизайн-система | 1.0–1.5 | ✅ Завершена (1.1–1.5 готовы) |
| 2 | Витрина на моковых данных | 2.1–2.10 | ✅ Завершена (2.1–2.10 готовы) |
| 3 | PostgreSQL: схема, функции брони, подключение витрины | 3.1–3.7 | ✅ Завершена (3.1–3.7 готовы) |
| 4 | Мобильная админка и медиа-пайплайн (S3) | 4.1–4.9 | ⬜ |
| 5 | Бронь, чекаут (Европочта), заявки, Telegram | 5.1–5.8 | ⬜ |
| 6 | Онлайн-оплата (карты + ЕРИП) | 6.1–6.4 | ⬜ |
| 7 | Инфраструктура в РБ, производительность и запуск | 7.1–7.8 | ⬜ |

---

## Фаза 1 — Фундамент, нейминг и дизайн-система

### Step 1.0 — Нейминг бренда (без кода, параллельно с 1.1)
- **Что делаем:** предлагаю 10–15 вариантов названия (короткие, легко пишутся латиницей для домена и звучат по-русски), проверяем свободность `<имя>.by` через WHOIS hoster.by, вы выбираете.
- **Файлы:** `docs/branding.md`.
- **✅ Готово, когда:** название выбрано, домен `.by` свободен (покупаем сразу или в Фазе 7 — 33 BYN/год).

### Step 1.1 — Инициализация проекта [x]
- **Что делаем:** `create-next-app` (App Router, TS, Tailwind, ESLint, `src/`, `@/*`), строгий `tsconfig` (`strict`, `noUncheckedIndexedAccess`), `no-explicit-any: error`, Prettier, скрипты `typecheck`/`lint`/`format`, `output: 'standalone'`, `<html lang="ru">`, `git init`. Сверяем API кэширования и `proxy.ts` с документацией установленной версии Next.js.
- **Файлы:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `.env.example`, `README.md`, `src/app/{layout,page}.tsx`.
- **✅ Готово:** Каркас Next.js 16.4.2 (App Router, Turbopack, React 19, TypeScript strict, Tailwind CSS v4, ESLint 9, Prettier) развернут. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅. Первый коммит выполнен.

### Step 1.2 — Дизайн-токены, шрифты, styleguide [x]
- **Что делаем:** палитра в `@theme inline` (`alabaster #FAF8F5`, `linen #F3EFE6`, `espresso #1C1917`, `muted #78716C`, **основной акцент `terracotta #9A5B42`**, вторичный `sage #4A5D4E` + оттенки hover/border). Шрифты: **Cormorant Garamond** (заголовки, цитаты) + **Manrope** (текст, характеристики, цены BYN) + сравнение с Inter. Страница `/styleguide` с интерактивной демонстрацией палитры, заголовков H1–H4, цитат, бейджей статусов кукол и цен в BYN.
- **Файлы:** `src/app/globals.css`, `src/lib/fonts.ts`, `src/app/layout.tsx`, `src/app/styleguide/page.tsx`.
- **✅ Готово:** Токены палитры и шрифтов внедрены. Страница `/styleguide` создана и успешно статически пререндерится. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅. Кириллическая шрифтовая пара протестирована.

### Step 1.3 — shadcn/ui под бренд [x]
- **Что делаем:** `components.json`; утилита `cn` (`clsx` + `tailwind-merge`); базовые UI-компоненты: `button`, `badge`, `card`, `input`, `textarea`, `label`, `dialog`, `sheet`, `sonner`, `skeleton`, `separator`, `tabs`, `checkbox`, `radio-group`. Маппинг семантических переменных shadcn в `globals.css` на фирменную палитру бренда (терракота, шалфей, лен, алебастр, эспрессо); кастомные варианты кнопок (`default` терракота, `secondary` шалфей, `subtle`, `sage-subtle`, `outline`, `ghost`, `destructive`, `link`), бейджи статусов кукол (`available`, `reserved`, `sold`, `in_progress`, `ooak`). Монтирование `<Toaster />` в корень `layout.tsx`.
- **Файлы:** `components.json`, `src/lib/utils.ts`, `src/lib/utils/cn.ts`, `src/components/ui/*`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/styleguide/page.tsx`.
- **✅ Готово:** Все компоненты реализованы без `any`, адаптированы под палитру «Теплый цифровой арт-бутик», экспортируются из `src/components/ui/`. Интерактивная витрина на `/styleguide` обновлена (диалог бронирования, шторка корзины, тосты Sonner, табы, карточка, поля ввода, бейджи). `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅.

### Step 1.4 — Каркас: Header, Footer, мобильное меню [x]
- **Что делаем:** `Container` (максимальная ширина, адаптивные отступы); `Header` (вордмарк бренда в Cormorant Garamond, микро-бар с доставкой по Беларуси, десктоп-навигация «Куклы в наличии · На заказ · Галерея · О мастере», счетчик корзины); `MobileNav` в `Sheet` (открывается по гамбургеру, закрывается по клику на ссылку или Esc, контакты Telegram/Viber/телефон мастера); `Footer` (манифест мастерской, соцсети, 4 колонки, реквизиты ИП по Указу № 60 и Торговому реестру РБ, ссылки на публичную оферту и Закон № 99-З); `src/app/(shop)/layout.tsx` для единого каркаса витрины.
- **Файлы:** `src/components/layout/Container.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`, `src/components/layout/Footer.tsx`, `src/app/(shop)/layout.tsx`, `src/app/(shop)/page.tsx`.
- **✅ Готово:** Каркас полностью адаптивен (протестирован на 375px, 768px, 1440px), мобильное меню работает на базе Radix Sheet, юридический блок строго соответствует требованиям торговли в РБ. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅.

### Step 1.5 — Доменные типы, моки, утилиты [x]
- **Что делаем:** Доменные типы (`Doll`, `DollStatus`, `DollCategory`, `DollImage`, `Order`, `OrderCustomer`, `OrderDelivery`); Zod-схемы валидации (`dollSchema`, `createOrderSchema`); 10 моковых кукол во всех статусах (включая `reserved` с активным и истекшим таймером, а также черновик `isDraft: true`); репозиторий `src/lib/data/catalog.ts` с фильтрацией, пагинацией и проверкой истечения брони; утилиты: `slugify` (кириллица → транслит), `formatPrice` (BYN), `normalizeBelarusPhone` / `formatBelarusPhone` (+375); настройка Vitest и 28 модульных тестов.
- **Файлы:** `src/types/domain.ts`, `src/lib/schemas/{doll,order}.ts`, `src/lib/data/{catalog.ts,mock/dolls.ts}`, `src/lib/utils/{slugify,format,phone}.ts`, `vitest.config.mts`, `src/lib/**/__tests__/*`.
- **✅ Готово:** `npm test` полностью зеленый (5 файлов, 28 тестов): «Лиза в лунном свете» → `liza-v-lunnom-svete`; `350` → «350 BYN»; `8029 123-45-67` → `+375291234567`; черновики строго исключаются из публичной выдачи. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅.

---

## Фаза 2 — Витрина на моковых данных

### Step 2.1 — Hero-блок [x]
- **Что делаем:** Атмосферный Hero-блок (`Hero.tsx`) в эстетике «Теплый цифровой арт-бутик»: крупный заголовок в Cormorant Garamond, цитата-манифест мастера, мобильные кнопки CTA («Смотреть работы в наличии» / «Кукла на заказ»), витринная карточка флагманской куклы «Селеста» с приоритетной LCP-загрузкой (`priority`), бэйджами статуса и плавающей мини-панелью характеристик, три микро-индикатора доверия по РБ; блок ценностей мастерской на главной странице.
- **Файлы:** `src/components/shop/Hero.tsx`, `src/app/(shop)/page.tsx`, `public/mock/dolls/selesta-1.svg`.
- **✅ Готово:** Выглядит журнально на 375px/390px и 1440px, нулевой сдвиг макета (CLS = 0), `next build` статически генерирует главную страницу с предзагрузкой данных флагманской куклы. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅.

### Step 2.2 — Карточка куклы и «Избранные работы» [x]
- **Что делаем:** `ProductCard` (портретное соотношение 4:5, лайк-сердечко с Sonner-тостом, имя, коллекция, характеристики, цена в BYN через `formatPrice`, кнопки действий под палец: «Бронь» / «Повтор» / «Предзаказ»); специализированный компонент `StatusBadge` с живым отсчетом минут резерва; адаптивная сетка `ProductGrid` (1 колонка на мобильном 375px, 2 колонки на планшете, 3 колонки на десктопе); секция `FeaturedSection` на главной странице с блоком индивидуального заказа; набор авторских векторных иллюстраций кукол в `public/mock/dolls/`.
- **Файлы:** `src/components/shop/StatusBadge.tsx`, `src/components/shop/ProductCard.tsx`, `src/components/shop/ProductGrid.tsx`, `src/components/shop/FeaturedSection.tsx`, `public/mock/dolls/*`, `src/app/(shop)/page.tsx`.
- **✅ Готово:** Сетка 1/2/3 колонки проверена, бейджи точно соответствуют статусам, карточки удобно листать и нажимать пальцем на смартфоне, переход по клику на детальную страницу `/kukly/[slug]`. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅.

### Step 2.3 — Переключатель и страницы-списки [x]
- **Что делаем:** Клиентские табы `CatalogTabs.tsx` («Ищут дом», «В процессе», «Архив») на главной странице со счетчиками количества работ и плавной фильтрацией без перезагрузки; отдельные статические страницы-маршруты: `/kukly` (полный каталог готовых кукол в наличии), `/na-zakaz` (страница индивидуального заказа: 4 этапа создания, сроки, условия, интерактивная форма заявки с валидацией номеров РБ +375 и оферты), `/galereya` (архив проданных работ в частных собраниях с блоком заказа по мотивам).
- **Файлы:** `src/components/shop/CatalogTabs.tsx`, `src/app/(shop)/kukly/page.tsx`, `src/app/(shop)/na-zakaz/page.tsx`, `src/app/(shop)/galereya/page.tsx`, `src/app/(shop)/page.tsx`.
- **✅ Готово:** Табы переключаются мгновенно без перезагрузки страницы; страницы `/kukly`, `/na-zakaz`, `/galereya` доступны из шапки, мобильного меню и кнопок; `next build` компилирует все маршруты как статические (○ Static). `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅.

### Step 2.4 — «О мастере» [x]
- **Что делаем:** Секция `AboutSection.tsx` на главной странице с метриками («350+ фей в уютных домах», «100% эко-хлопок и дерево», «100% ручная работа OOAK») и художественной иллюстрацией мастерской; отдельная страница `/o-mastere` (история мастера Алёны Прокопенко, философия мастерства: натуральный хлопковый шнур макраме, гладкие бусины из светлого бука и березы с нежной ручной росписью, резные крылышки из шпона, невесомый ромашковый фатин, крафтовая подарочная упаковка с тишью и лентой); навигация из меню шапки и футера без 404.
- **Файлы:** `src/components/shop/AboutSection.tsx`, `src/app/(shop)/o-mastere/page.tsx`, `public/mock/dolls/fairy-blue-1.jpg`, `src/app/(shop)/page.tsx`.
- **✅ Готово:** Блок `AboutSection` интегрирован на главной странице, страница `/o-mastere` свёрстана в арт-стиле Cormorant + Manrope, адаптивна под мобильные экраны и десктоп; навигация работает; `next build` компилирует `/o-mastere` статически (○ Static). `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅.

### Step 2.5 — Страница куклы `/kukly/[slug]` [x]
- **Что делаем:** галерея со студийными фотографиями (полный рост и макро-детали личика/цветов), история, карточка характеристик (размер, материалы: хлопок, фатин, бук; комплектация), цена 45–65 BYN. `BuyButton` по статусу: «Купить» / «Забронирована до HH:MM» (клиентский остров сверяет `reserved_until` с текущим временем) / «В частной коллекции» + «Хочу похожую на заказ» / «Заказать похожую». Мобильный липкий бар под палец (`isStickyMobile`), табы доставки Европочтой и ухода, блок рекомендаций других фей мастера. `generateStaticParams`, `notFound()`, `generateMetadata`.
- **Файлы:** `src/app/(shop)/kukly/[slug]/page.tsx`, `src/components/shop/{ProductGallery,SpecsCard,ProductStory,BuyButton,ReservationCountdown}.tsx`, `src/app/(shop)/kukly/[slug]/__tests__/page.test.ts`.
- **✅ Готово:** 18 статических маршрутов предгенерированы (`next build` SSG); CTA корректен для каждого статуса; истёкшая бронь («Кларисса») автоматически открыта для покупки; активная бронь («Беатрис») отображает таймер отсчёта; черновик («Черновик мастера») возвращает 404; мобильный бар закреплен снизу экрана для удобства на смартфонах. `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅ (36 тестов).

### Step 2.6 — Полноэкранный зум [x]
- **Что делаем:** лайтбокс: pinch-zoom (щипок двумя пальцами от 1x до 4x), двойной тап (быстрое приближение 2.5x к точке тапа / сброс), свайпы (горизонтальный для листания фото, вертикальный свайп вниз для закрытия), клавиатура (стрелки влево/вправо, Esc для закрытия, +/-/0 для зума), счётчик фото, миниатюры внизу, плавный переход из галереи `ProductGallery`.
- **Файлы:** `src/components/shop/Lightbox.tsx`, `src/components/shop/ProductGallery.tsx`, `src/components/shop/__tests__/Lightbox.test.ts`.
- **✅ Готово:** на смартфоне роспись личика, текстуру пряжи и букетик можно рассмотреть в мельчайших деталях через pinch-zoom и двойной тап; на десктопе работают стрелки, колесико мыши, клик-энд-драг и Esc; `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅ (41 тест).

### Step 2.7 — Галерея «Нашли дом» [x]
- **Что делаем:** `/galereya` в стиле арт-портфолио (editorial/masonry), фильтрация по категориям («Все», «Цветочные феи», «Ангелы», «Миниатюры»), карточки проданных работ с годом создания, городом коллекции, цитатой мастера и бесшовным открытием Lightbox для детального просмотра, призыв к действию CTA «Хотите похожую? Оставьте заявку» с автоматическим предзаполнением формы `/na-zakaz?from=${slug}`.
- **Файлы:** `src/app/(shop)/galereya/page.tsx`, `src/components/shop/GalleryGrid.tsx`, `src/app/(shop)/na-zakaz/page.tsx`, `src/components/shop/__tests__/GalleryGrid.test.ts`.
- **✅ Готово:** выглядит как изысканное арт-портфолио мастерской; страница проданной куклы и карточки архива бесшовно ведут к созданию феи по мотивам (`/na-zakaz?from=...`); `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅, `npm test` ✅ (45 тестов).

### Step 2.8 — Форма «Хочу похожую» (UI) [x]
- **Что делаем:** `CustomRequestModal` (адаптивный `Dialog` на десктопе / `Sheet` снизу на мобильном); поля: имя, телефон (валидация и нормализация номеров РБ +375), выбор предпочтительного канала связи (Telegram / Viber / звонок), пожелания к фее; **обязательный чекбокс согласия на обработку ПД** со ссылкой на политику (не отмечен заранее); honeypot-ловушка против спам-ботов; Zod-схема валидации; мок-отправка с экраном успеха и Sonner-тостом.
- **Файлы:** `src/components/shop/CustomRequestForm.tsx`, `src/lib/schemas/custom-request.ts`, `src/lib/schemas/__tests__/custom-request.test.ts`.
- **✅ Готово:** валидация на русском, без согласия ПД отправка блокируется с понятным сообщением; honeypot отсекает спам-ботов; номера РБ нормализуются в +375; тост «Заявка мастеру отправлена»; `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (52 теста).

### Step 2.9 — Информационные и юридические страницы [x]
- **Что делаем:** `/dostavka-i-oplata` (подробный гид по Европочте: тарифы, ОПС и курьер, подарочная и транспортировочная упаковка, расчеты в BYN, наложенный платеж и онлайн-оплата), `/oferta` (публичный договор купли-продажи авторских изделий ручной работы для РБ в соответствии со ст. 405, 407 ГК РБ), `/politika-konfidencialnosti` (политика оператора по Закону РБ № 99-З «О защите персональных данных»), переиспользуемый компонент реквизитов продавца `LegalInfo.tsx` (ИП Прокопенко А. В., УНП 193758204, Торговый реестр РБ № 584920, Минск, орган защиты потребителей).
- **Файлы:** `src/app/(shop)/{dostavka-i-oplata,oferta,politika-konfidencialnosti}/page.tsx`, `src/components/layout/LegalInfo.tsx`, `src/components/layout/Footer.tsx`, `src/app/(shop)/__tests__/legal-pages.test.ts`.
- **✅ Готово:** все 3 страницы открываются без 404, ссылки в футере и формах обновлены; типографика длинных юридических текстов аккуратно отформатирована; `next build` статически генерирует все маршруты (24 SSG страницы); `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (56 тестов).

### Step 2.10 — Полировка витрины [x]
- **Что делаем:** `loading.tsx`-скелетоны для бесшовной предзагрузки страниц каталога с защитой от сдвига макета (CLS = 0), кастомная арт-страница 404 (`not-found.tsx`), расширенные метаданные OpenGraph и Twitter Cards на русском языке (`locale: ru_BY`, `siteName: DollShop`), директива `prefers-reduced-motion` для пользователей с чувствительностью к анимации, доступный фокус-ринг для клавиатурной навигации (`:focus-visible`), проверка адаптивности на экранах смартфонов 375px/390px.
- **Файлы:** `src/app/not-found.tsx`, `src/app/loading.tsx`, `src/app/(shop)/loading.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/__tests__/polish.test.ts`.
- **✅ Готово:** Фаза 2 полностью завершена (10 из 10 шагов); 24 статические страницы генерируются через SSG (`next build`); скелетоны предотвращают layout shift; страница 404 оформлена в стиле арт-бутика; `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (60 тестов зелёные).

---

## Фаза 3 — PostgreSQL: схема, функции брони, подключение витрины

### Step 3.1 — Postgres в Docker + Drizzle [x]
- **Что делаем:** `docker-compose.yml` с PostgreSQL 18 (Alpine, TZ: Europe/Minsk, healthcheck `pg_isready`), Drizzle ORM + drizzle-kit + драйвер `postgres.js`, пул соединений с физической защитой `server-only`, строгая Zod-валидация `src/lib/env.ts` с понятными русскоязычными ошибками при отсутствии `DATABASE_URL`, `.env.example`, `.env.local`, `drizzle.config.ts`, скрипты `npm run db:*` в `package.json`.
- **Файлы:** `docker-compose.yml`, `drizzle.config.ts`, `src/db/client.ts`, `src/lib/env.ts`, `src/lib/__tests__/env.test.ts`, `src/db/__tests__/client.test.ts`, `vitest.config.mts`, `.env.example`, `.env.local`, `package.json`.
- **✅ Готово:** `docker-compose.yml` сконфигурирован для PostgreSQL 18; локальный кластер PostgreSQL 18 в `/tmp/dollshop_pg` инициализирован и активен в фоне (`task-1584`); создана БД `dollshop` и роль `dollshop_app`; строгая Zod-валидация выбрасывает понятную ошибку `DATABASE_URL обязательна для подключения к PostgreSQL`; пул `client` и Drizzle `db` успешно выполняют запросы; `npm test` ✅ (69 тестов зелёные, 13 тест-сьютов), `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅ (24 статические страницы).

### Step 3.2 — Схема и миграции [x]
- **Что делаем:** enums (`product_status`, `media_type`, `order_status`, `contact_channel`, `payment_method`, `request_status`), таблицы (`products`, `product_media`, `reservations`, `orders`, `order_items`, `custom_requests`, `site_settings`, `rate_limits`), FK (cascade/restrict/set null), индексы, CHECK-ограничения (`currency = 'BYN'`, цена ≥ 0, сумма заказа ≥ 0), автоматический триггер `updated_at` (`update_updated_at_column`), скрипт `src/db/migrate.ts`.
- **Файлы:** `src/db/schema.ts`, `drizzle/0000_lyrical_sleeper.sql`, `src/db/migrate.ts`, `src/db/__tests__/schema.test.ts`, `drizzle.config.ts`, `package.json`.
- **✅ Готово:** миграции успешно сгенерированы (`drizzle/0000_lyrical_sleeper.sql`) и применены к PostgreSQL 18 через `npm run db:migrate`; в БД созданы все 8 таблиц, 6 перечислений и 4 триггера `updated_at`; CHECK-ограничения блокируют отрицательные цены и чужие валюты; каскадное удаление медиа и броней работает; `npm test` ✅ (79 тестов зелёные, 14 сьютов), `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅ (24 страницы).

### Step 3.3 — Роли и права БД [x]
- **Что делаем:** роли `app_owner` (миграции, DDL) и `app_user` (только DML + `EXECUTE` функций), revoke у `PUBLIC`, миграция прав `drizzle/0001_roles.sql`, скрипт инициализации `docker/postgres/init/02_roles.sql`, тесты на блокировку деструктивного DDL под `app_user`.
- **Файлы:** `drizzle/0001_roles.sql`, `docker/postgres/init/02_roles.sql`, `src/db/__tests__/roles.test.ts`, `src/lib/env.ts`, `src/db/migrate.ts`, `.env.example`, `.env.local`.
- **✅ Готово:** роли созданы и проверены; все таблицы, последовательности и функции принадлежат `app_owner`; `app_user` успешно выполняет SELECT, INSERT, UPDATE, DELETE, но не может выполнить DROP TABLE, ALTER TABLE, TRUNCATE TABLE или CREATE TABLE (возвращается ошибка 42501 insufficient_privilege); мигратор `src/db/migrate.ts` использует `app_owner`; `npm test` ✅ (86 тестов зелёные, 15 сьютов), `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅.

### Step 3.4 — Функции брони и заказов [x]
- **Что делаем:** SQL-функции `reserve_product`, `release_reservation`, `create_order`, `set_order_status`, `expire_reservations`; типизированные TypeScript-обёртки в `src/db/functions.ts`; скрипт проверки гонки `scripts/race-reserve.ts`.
- **Файлы:** `drizzle/0002_functions.sql`, `docker/postgres/init/03_functions.sql`, `src/db/functions.ts`, `scripts/race-reserve.ts`, `src/db/__tests__/functions.test.ts`.
- **✅ Готово:** все 5 функций созданы и переданы под управление `app_owner` с правами `EXECUTE` для `app_user`; стресс-тест `scripts/race-reserve.ts` при **200 параллельных запросах** бронирования на одну куклу показал ровно **1 победу** и 199 отсечений `ALREADY_RESERVED` за 38 мс; проверена идемпотентность и повторное бронирование после освобождения; интеграционные тесты покрывают бронь, заказ с ценой из БД, оплату, отмену и cron-истечение; `npm test` ✅ (90 тестов зелёные, 16 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

### Step 3.5 — Сид [x]
- **Что делаем:** идемпотентный сид каталога `src/db/seed.ts`, маппинг строк БД в доменные модели витрины `src/lib/data/drizzle/mappers.ts`, команда `npm run db:seed`.
- **Файлы:** `src/db/seed.ts`, `src/lib/data/drizzle/mappers.ts`, `src/db/__tests__/seed.test.ts`, `package.json`.
- **✅ Готово:** `npm run db:seed` успешно наполнил PostgreSQL 18 всеми 13 куклами-феями, студийными фотографиями и реквизитами ИП; мапперы `mapDbProductToDoll` и `mapDbSiteSettingsToDomain` обеспечивают строгую типизацию без `any`; `npm test` ✅ (94 теста зелёные, 17 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

### Step 3.6 — Витрина на БД с тегами кэша [x]
- **Что делаем:** реализация `src/lib/data/drizzle/catalog.ts` на Drizzle с тегами (`products`, `product:{slug}`, `settings`), реестр тегов `src/lib/cache/tags.ts`, чистая изоляция клиентских утилит `src/lib/data/status.ts`; публичная витрина переключена с моков на живую базу данных.
- **Файлы:** `src/lib/data/drizzle/catalog.ts`, `src/lib/cache/tags.ts`, `src/lib/data/status.ts`, `src/lib/data/catalog.ts`, `src/components/shop/{ProductCard,StatusBadge,BuyButton}.tsx`.
- **✅ Готово:** витрина, каталог `/kukly`, страница куклы `/kukly/[slug]` и галерея `/galereya` читают данные напрямую из PostgreSQL 18; Next.js ISR кэширует страницы с тегами (`Revalidate: 1h, Expire: 1y`); `server-only` гарантирует отсутствие утечек драйверов в бандлы браузера; `npm run build` ✅ генерирует все 27 страниц, `npm test` ✅ (94 теста зелёные, 17 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

### Step 3.7 — `/api/revalidate` [x]
- **Что делаем:** Route Handler с `REVALIDATE_SECRET`, Zod-валидация списка тегов.
- **Файлы:** `src/app/api/revalidate/route.ts`, `src/app/api/revalidate/__tests__/route.test.ts`, `src/lib/env.ts`, `.env.example`.
- **✅ Готово:** Route Handler `src/app/api/revalidate/route.ts` реализован с проверкой секрета `REVALIDATE_SECRET` (через заголовок `Authorization: Bearer <secret>`, заголовок `x-revalidate-secret` или query-параметр `?secret=`), строгой Zod-валидацией массива `tags` и опционального `paths`, вызовом `revalidateTag` и `revalidatePath`; написан полный сьют интеграционных тестов `src/app/api/revalidate/__tests__/route.test.ts` (6 тестов: 401 при неверном/отсутствующем секрете, 400 при пустом payload или некорректных тегах, 200 при валидном запросе с проверкой вызова revalidate); живой `curl` запрос на работающий dev-сервер вернул 200 OK `{"revalidated":true,"tags":["products","product:selesta"],"paths":[],"timestamp":"..."}`; `npm test` ✅ (100 тестов зелёные, 18 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

---

## Фаза 4 — Мобильная админка и медиа-пайплайн (S3)

### Step 4.1 — Вход мастера (Better Auth) [x]
- **Что делаем:** Better Auth (email + пароль, Drizzle adapter, регистрация выключена, rate-limit), CLI-скрипт создания учётки мастера, `/admin/login`, охрана в `proxy.ts`, `requireAdmin()`, выход.
- **Файлы:** `src/lib/auth/*`, `src/app/api/auth/[...all]/route.ts`, `src/proxy.ts`, `src/middleware.ts`, `src/app/admin/login/page.tsx`, `scripts/create-admin.ts`, `src/lib/auth/__tests__/auth.test.ts`.
- **✅ Готово:** Таблицы `user`, `session`, `account`, `verification` созданы в PostgreSQL 18 миграцией `0003_auth.sql`; настроен серверный Better Auth с Drizzle-адаптером и клиентский SDK; CLI-скрипт `npm run auth:create-admin` инициализирует мастера `master@dollshop.by`; охранный шлюз `adminProxy` и `requireAdminAction/requireAdminPage` защищают маршруты `/admin/*` с сохранением `returnUrl`; страница `/admin/login` оформлена в палитре бренда с понятными русскими ошибками; `npm test` ✅ (108 тестов зелёные, 19 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

### Step 4.2 — Оболочка админки [x]
- **Что делаем:** адаптивная мобильная оболочка по концепции **Zero-IT UX** (никакого визуального мусора, лаконичный интерфейс под палец): нижний таб-бар (Заказы · Куклы · Заявки · Настройки), тап-зоны ≥ 44px, safe-area iPhone, список кукол с крупными превью и фильтром-чипами по человеческим статусам («🟢 В наличии», «🏡 В архиве», «✨ На заказ», «📝 Черновики»), плавающая кнопка (FAB) «+ Новая кукла».
- **Файлы:** `src/app/admin/(panel)/layout.tsx`, `src/app/admin/(panel)/page.tsx`, `src/app/admin/(panel)/kukly/page.tsx`, `src/app/admin/(panel)/{zakazy,zayavki,nastrojki}/page.tsx`, `src/components/admin/{AdminHeader,AdminBottomNav,DollsListClient}.tsx`, `src/components/admin/__tests__/DollsListClient.test.ts`.
- **✅ Готово:** Оболочка админки полностью реализована под концепцию Zero-IT UX: мобильный таб-бар с безопасными отступами под жесты iOS; список кукол с крупными превью, индикаторами статусов и горизонтальными фильтр-чипами; поиск по названию; плавающая кнопка (FAB) «+ Новая кукла»; `npm test` ✅ (112 тестов зелёные, 20 сьютов), `npm run typecheck` ✅, `npm run lint` ✅.

### Step 4.3 — Форма куклы «Zero-IT UX» (в один экран) [x]
- **Что делаем:**
  - **Форма в один экран:** все поля помещаются на одном чистом вертикальном экране без вкладок, аккордеонов и сложных таблиц.
  - **Полное сокрытие технических полей:** поля `slug`, `blur_data_url`, `sort_order`, `id` полностью скрыты от мастера.
  - **Автоматический `slug` на сервере:** транслитерация названия `title` в латиницу через `slugify` + короткий случайный суффикс при коллизиях. Мастер не тратит время на латиницу и URL.
  - **Автоматическая сортировка:** новая кукла по умолчанию всегда встаёт на первое место в каталоге (`sort_order = 0` / по дате создания).
  - **Характеристики через быстрые чипы-подсказки:** под полем материалов и деталей располагаются кликабельные чипы-подсказки («Ладолл», «Полимерная глина», «Мохер», «Стеклянные глаза», «Шарнирная», «Текстиль», «Винтажный хлопок», «Эко-хлопок макраме», «Резной бук» и др.) — нажатие на чип мгновенно добавляет материал без утомительного набора с экранной клавиатуры.
  - **Человеческие статусы на кнопках:** вместо технического `available / sold / made_to_order`:
    - «🟢 Ищет дом (В наличии)»
    - «🏡 Нашла дом (В архив)»
    - «✨ На заказ»
    - отдельная кнопка «📝 Сохранить черновик»
  - Цена в BYN (`inputMode="decimal"`), блок истории с AI-ассистентом, автосохранение черновика в `localStorage` (защита от случайного закрытия браузера), Server Actions + Zod + `requireAdmin()`, инвалидация `revalidateTag`.
- **Файлы:** `src/app/admin/(panel)/kukly/{new,[id]}/page.tsx`, `src/components/admin/{ProductForm,MaterialChips}.tsx`, `src/actions/admin/products.ts`, `src/actions/admin/__tests__/products.test.ts`.
- **✅ Готово:** Форма куклы в один экран разработана по концепции Zero-IT UX: все технические атрибуты (`slug`, `sort_order`, `blur_data_url`) скрыты; автоматическая генерация уникального транслитерированного slug на сервере с разрешением коллизий; кликабельные чипы материалов мгновенно добавляют теги без ручного ввода; человеческие кнопки статусов («🟢 Ищет дом», «🏡 Нашла дом», «✨ На заказ», «📝 Сохранить черновик»); автосохранение черновика в `localStorage` с ненавязчивым баннером восстановления; защищённые Server Actions `saveProductAction` и `deleteProductAction` с проверкой сессии мастера и инвалидацией тегов каталога; 5/5 тестов в `src/actions/admin/__tests__/products.test.ts` ✅, общий сьют 117 тестов ✅, `tsc` и `eslint` ✅.

### Step 4.4 — S3-хранилище и presigned URL
- **Что делаем:** аккаунт hoster.by и dev-бакет S3 (или S3-эмулятор в `docker-compose.yml`), CORS для `PUT`, `StorageAdapter` + S3-реализация, Server Action `createUploadUrls` (`requireAdmin`, MIME-whitelist, лимит размера, ключи `products/{productId}/{mediaId}/{size}.webp`, TTL 5 мин, `immutable`). Выбираем способ раздачи: напрямую из S3 или через nginx.
- **Файлы:** `src/lib/storage/{adapter,s3}.ts`, `src/actions/admin/media.ts`, `docs/storage-setup.md`.
- **✅ Готово, когда:** загрузка из браузера по presigned URL проходит без CORS-ошибок, файл открывается по публичному URL, без сессии админа — отказ.

### Step 4.5 — Клиентское сжатие в WebP
- **Что делаем:** Web Worker: decode (+ HEIC-фоллбек), WebP 2000/1280/640px (цель ≤ 350/150/60 КБ), blur 16px base64, `width/height`; параллельная загрузка с прогрессом и повтором.
- **Файлы:** `src/lib/images/{compress,blur,upload}.ts`, `src/lib/images/compress.worker.ts`.
- **✅ Готово, когда:** фото 8–12 МБ с телефона → три WebP, старший ≤ 350 КБ и ≤ 2000px; интерфейс не подвисает.

### Step 4.6 — Менеджер медиа «Без боли на телефоне»
- **Что делаем:**
  - Мультивыбор фотографий (напрямую с камеры смартфона или из медиатеки) с индикацией прогресса сжатия и загрузки.
  - **Отказ от мобильного Drag-and-Drop:** DnD на тач-экранах конфликтует с вертикальным скроллом страницы и приводит к ложным срабатываниям.
  - **Простые тактильные кнопки на каждом превью фото:**
    - «⭐ Сделать главным» (выставляет фото первым с `display_order = 0`);
    - «🗑️ Удалить» (удаление из базы и S3);
    - Стрелочки «◀ Влево» и «▶ Вправо» для точного и легкого изменения порядка фотографий пальцем.
  - Свой loader `next/image` на витрине, автоматическое заполнение `alt` из названия куклы.
- **Файлы:** `src/components/admin/MediaManager.tsx`, `src/lib/images/loader.ts`, `next.config.ts`.
- **✅ Готово, когда:** на смартфоне можно легко загрузить фото, нажать «⭐ Сделать главным» или подвинуть стрелками без конфликта со скроллом; витрина мгновенно отражает изменения.

### Step 4.7 — AI-ассистент «✨ Сгенерировать историю» (Google Gemini Pro)
- **Что делаем:** подключение модели **Gemini 1.5 Pro** с API-ключом мастера от подписки Google AI Pro ($10/мес бесплатных кредитов), маршрутизация через легковесный Cloudflare Worker proxy для прозрачного обхода гео-блокировки белорусских IP, системный промпт с тёплым голосом бренда, стриминг текста прямо в форму истории куклы, кнопки «Ещё вариант / Короче / Теплее», rate-limit.
- **Файлы:** `src/lib/ai/{gemini,prompts}.ts`, `src/actions/admin/ai.ts`, `src/components/admin/AiStoryButton.tsx`.
- **✅ Готово, когда:** из заметок «20 см, мятный хлопок, фатин с ромашками, незабудки, весенняя» за ~3–5 секунд появляется связный художественный текст на русском; кредиты расходуются с подписки Google AI Pro ($0 доплат).

### Step 4.8 — PWA
- **Что делаем:** `manifest.ts` (`start_url: /admin`, standalone, цвета бренда), иконки (maskable, apple-touch-icon), мета для iOS.
- **Файлы:** `src/app/manifest.ts`, `public/icons/*`.
- **✅ Готово, когда:** «На главный экран» → админка открывается как приложение с иконкой бренда.

### Step 4.9 — Сценарий «Кукла за 60 секунд» (Zero-IT UX тест)
- **Что делаем:** UX-прогон и полировка полного флоу добавления куклы нетехническим творцом: форма в один экран, выбор материалов в 2 тапа по чипам, загрузка фото с камеры, выбор обложки кликом по «⭐», генерация душевного описания через Gemini, выбор человеческого статуса («🟢 Ищет дом») и сохранение.
- **Файлы:** `e2e/admin-creator-flow.spec.ts`, `docs/creator-ux-guide.md`.
- **✅ Готово, когда:** мастер с секундомером на телефоне публикует новую куклу за 60–90 секунд без единого вопроса про IT-термины.

---

## Фаза 5 — Бронь, чекаут (Европочта), заявки, Telegram

### Step 5.1 — «Купить» → атомарная бронь
- **Что делаем:** Server Action `reserveProduct` → `reserve_product`; токен в httpOnly-cookie; `revalidateTag`; редирект на `/oformlenie/[slug]`; мягкие сообщения «Уже забронирована / Продана».
- **Файлы:** `src/actions/reserve.ts`, `src/components/shop/BuyButton.tsx`, `src/app/(checkout)/oformlenie/[slug]/page.tsx`.
- **✅ Готово, когда:** два браузера одновременно → один в чекауте, второй видит «Эту куклу только что забронировали».

### Step 5.2 — Чекаут под Европочту
- **Что делаем:** таймер 15:00, сводка куклы и доставки; форма: ФИО полностью, телефон +375 (маска), канал связи (Telegram / Viber / звонок), населённый пункт, отделение Европочты (номер/адрес), комментарий, способ оплаты (из включённых в настройках: ЕРИП-счёт / перевод / наложенный платёж), согласие на обработку ПД + принятие оферты. Server Action → `create_order`; страница `/zakaz/[token]`.
- **Файлы:** `src/components/checkout/{CheckoutForm,CountdownTimer,DeliveryFields}.tsx`, `src/actions/order.ts`, `src/app/(checkout)/zakaz/[token]/page.tsx`.
- **✅ Готово, когда:** заказ создаётся и кукла остаётся в брони; после истечения таймера отправка отклоняется; «Отменить бронь» возвращает куклу в продажу.

### Step 5.3 — Telegram: уведомления мастеру и кнопки управления
- **Что делаем:** бот через BotFather, `chat_id`; шаблоны (HTML с экранированием): кукла, цена, ФИО, телефон, кликабельные ссылки на Viber/Telegram, город и отделение Европочты, способ оплаты, ссылка в админку.
- **Интерактивные Inline-кнопки в уведомлении о заказе:**
  - «✅ Подтвердить продажу (Перевести куклу в Архив)»
  - «❌ Отменить бронь (Вернуть в наличие)»
  - «🔗 Открыть заказ в админке»
- Отправка через `after()` без замедления чекаута.
- **Файлы:** `src/lib/notify/{telegram,templates}.ts`, `docs/telegram-setup.md`.
- **✅ Готово, когда:** новый заказ приходит в Telegram за 1–2 секунды вместе с кнопками подтверждения/отмены; при недоступном Telegram заказ всё равно создаётся в БД.

### Step 5.4 — Заявки «Хочу похожую» в БД
- **Что делаем:** форма из Step 2.8 → Server Action → insert, honeypot, rate-limit, `pd_consent_at`, уведомление в Telegram.
- **Файлы:** `src/actions/request.ts`, `src/lib/security/rate-limit.ts`.
- **✅ Готово, когда:** заявка сохраняется и приходит в Telegram; 6-я за минуту с одного IP отклоняется.

### Step 5.5 — Админка: заказы
- **Что делаем:** дашборд (новые сверху, счётчики), карточка заказа, кнопки связи (Viber / Telegram / звонок), **«Скопировать сообщение покупателю»** (шаблон с суммой, реквизитами или инструкцией по ЕРИП), смена статуса через `set_order_status` (`paid` → кукла `sold`, `cancelled` → `available`), трек-номер Европочты.
- **Файлы:** `src/app/admin/(panel)/zakazy/{page,[id]/page}.tsx`, `src/components/admin/OrderCard.tsx`, `src/actions/admin/orders.ts`.
- **✅ Готово, когда:** «Оплачен» → кукла переехала в «Галерею» с бейджем «В частной коллекции»; трек-номер виден покупателю на `/zakaz/[token]` со ссылкой на отслеживание.

### Step 5.6 — Админка: заявки
- **Что делаем:** входящие с чипами статусов (`new` → `in_discussion` → `accepted` / `declined`), превью референсной куклы, кнопки связи.
- **Файлы:** `src/app/admin/(panel)/zayavki/page.tsx`, `src/actions/admin/requests.ts`.
- **✅ Готово, когда:** статусы сохраняются, новые заявки подсвечены.

### Step 5.7 — Настройки магазина
- **Что делаем:** `/admin/nastroyki`: реквизиты ИП (ФИО, УНП, № в Торговом реестре), контакты и соцсети, условия и стоимость доставки, включённые способы оплаты, TTL брони, тексты «О мастере», шаблон сообщения с реквизитами; тег `settings`.
- **Файлы:** `src/app/admin/(panel)/nastroyki/page.tsx`, `src/actions/admin/settings.ts`, `src/lib/data/settings.ts`.
- **✅ Готово, когда:** правка реквизитов или текста сразу видна в подвале и на витрине; выключенный наложенный платёж пропадает из чекаута.

### Step 5.8 — Управление заказами из Telegram-бота (Inline-кнопки и вебхук)
- **Что делаем:** реализация ключевого сценария **Zero-IT UX** — мастер управляет заказами и наличием кукол прямо из мессенджера без необходимости заходить на сайт.
  - Обработчик вебхука `/api/telegram/webhook` с валидацией `X-Telegram-Bot-Api-Secret-Token` и жесткой привязкой к `TELEGRAM_CHAT_ID` мастера.
  - Нажатие **«✅ Подтвердить продажу»**: вызывает `set_order_status(orderId, 'paid')`, кукла атомарно переходит в `sold` («Нашла дом»), выполняется `revalidateTag('products')` и `revalidateTag('product:{slug}')`, бот обновляет сообщение в чате («✅ Заказ #X подтверждён, кукла переведена в Архив»).
  - Нажатие **«❌ Отменить бронь»**: вызывает `set_order_status(orderId, 'cancelled')`, кукла возвращается в `available` («Ищет дом»), кэш инвалидируется, бот обновляет сообщение («❌ Бронь #X отменена, кукла снова в продаже»).
  - Локальный тест через dev-туннель, постоянная работа в продакшене.
- **Файлы:** `src/app/api/telegram/webhook/route.ts`, `src/lib/notify/telegram.ts`.
- **✅ Готово, когда:** клик по кнопке в Telegram без захода в админку переводит статус куклы на витрине и обновляет сообщение в чате.

---

## Фаза 6 — Онлайн-оплата (карты + ЕРИП)

> Начинаем, когда выбран провайдер и подписан договор (банк-эквайер + процессинг). По умолчанию рекомендую **bePaid**: карты и ЕРИП в одной интеграции. Альтернатива — **Express-Pay**, если хватит одного ЕРИП. Перед договором уточните минимальную ежемесячную плату и требования к чекам.

### Step 6.1 — Абстракция `PaymentProvider` + sandbox
- **Что делаем:** интерфейс (`createCardPayment`, `createEripInvoice`, `verifyWebhook`, `getStatus`), реализация выбранного провайдера в тестовом режиме, режим чекаута «Онлайн-оплата» в настройках.
- **Файлы:** `src/lib/payments/{provider,<impl>}.ts`, правка `src/actions/order.ts`.
- **✅ Готово, когда:** в sandbox создаётся платёж и возвращается ссылка или номер счёта.

### Step 6.2 — Оплата картой
- **Что делаем:** редирект на платёжную страницу (3-D Secure), возврат на `/zakaz/[token]`; срок платёжной сессии ≤ срока брони.
- **✅ Готово, когда:** тестовая карта → заказ ждёт подтверждения вебхуком.

### Step 6.3 — Автоматический счёт ЕРИП
- **Что делаем:** выставление счёта ЕРИП, инструкция «Оплатите в приложении банка: ЕРИП → … → номер заказа» и QR-код; бронь продлевается на `erip_hold_hours`; по истечении счёт аннулируется, кукла возвращается в продажу.
- **✅ Готово, когда:** в sandbox счёт создаётся, его оплата переводит заказ в `paid`.

### Step 6.4 — Вебхуки и пограничные случаи
- **Что делаем:** проверка подписи, идемпотентность по `payment_id`, `paid` → `sold` → ревалидация → Telegram «💰 Оплата получена». Чек-лист: неоплаченная сессия, оплата после истечения брони (автовозврат или ручное решение мастера), повторная доставка вебхука, поддельный вебхук.
- **Файлы:** `src/app/api/payments/webhook/route.ts`, `docs/checkout-edge-cases.md`.
- **✅ Готово, когда:** все сценарии чек-листа приводят к согласованным статусам заказа и куклы.

---

## Фаза 7 — Инфраструктура в РБ, производительность и запуск

### Step 7.1 — Cron-задачи
- **Что делаем:** `/api/cron/expire-reservations` (`CRON_SECRET`), `/api/health` (проверка БД), cron-контейнер (раз в минуту — брони, ежедневно — бэкап).
- **Файлы:** `src/app/api/cron/expire-reservations/route.ts`, `src/app/api/health/route.ts`, `deploy/cron/*`.
- **✅ Готово, когда:** локально бронь без заказа через 15 минут сама освобождается, витрина обновляется в течение минуты.

### Step 7.2 — Docker-образ и прод-композиция (локально)
- **Что делаем:** multi-stage `Dockerfile` (standalone, non-root), `docker-compose.prod.yml` (nginx + web + db + cron), nginx: gzip/brotli, микрокэш 5 с с `use_stale updating` и `cache_lock`, security headers и CSP, кэш статики.
- **Файлы:** `Dockerfile`, `deploy/docker-compose.prod.yml`, `deploy/nginx/*.conf`.
- **✅ Готово, когда:** `docker compose -f deploy/docker-compose.prod.yml up` поднимает полный стек на ноутбуке и сайт работает через nginx.

### Step 7.3 — Нагрузочный тест
- **Что делаем:** k6/autocannon по главной и страницам кукол на прод-композиции, мониторинг запросов к Postgres и CPU Node.
- **Файлы:** `scripts/load-test.js`, `docs/performance.md`.
- **✅ Готово, когда:** при тысячах RPS к витрине Postgres получает ≈ 0 запросов на чтение, p95 — десятки миллисекунд; минимальная конфигурация VPS подтверждена цифрами.

### Step 7.4 — SEO
- **Что делаем:** `sitemap.ts`, `robots.ts`, OG-картинки кукол (`next/og`, кириллические шрифты), JSON-LD `Product` (цена в BYN, `availability`), canonical, мета для Яндекса.
- **Файлы:** `src/app/{sitemap,robots}.ts`, `src/app/(shop)/kukly/[slug]/opengraph-image.tsx`, `src/components/seo/JsonLd.tsx`.
- **✅ Готово, когда:** валидаторы Google и Яндекса без ошибок; ссылка в Telegram/Viber показывает превью с фото и ценой.

### Step 7.5 — Комплексный аудит безопасности и бэкапы
- **Что делаем:** 
  1. `backup.sh` (pg_dump → шифрование AES-256 → S3, хранение 14 дней), `restore.sh` с тестом восстановления на чистой базе.
  2. **Пентест-проверка через DevTools браузера:** аудит JS-бандла на отсутствие секретов (`server-only`), проверка отключения Source Maps на проде, проверка `httpOnly` кук (недоступны из консоли), попытка подмены цены в запросе (сервер берет цену только из БД), попытка перебора заказов (IDOR невозможен благодаря UUIDv4 `public_token`).
  3. Проверка Honeypot и Rate-limiting на формах, заголовки безопасности в Nginx (CSP, HSTS, X-Frame-Options: DENY), закрытие порта Postgres наружу.
- **Файлы:** `deploy/scripts/{backup,restore}.sh`, `docs/security-checklist.md`, `tests/security.spec.ts`.
- **✅ Готово, когда:** восстановление из бэкапа проходит; попытка подмены цены или взлома чекаута отклоняется; securityheaders.com — оценка A; DevTools не показывает ни одного секрета или приватного поля.

### Step 7.6 — Покупка инфраструктуры (вместе, по инструкции)
- **Что делаем:** сверяем тарифы hoster.by / hb.by и выбираем; домен `.by`; VPS 2 vCPU / 2–4 ГБ (Ubuntu LTS) в РБ; бакеты S3 (media + backups); DNS; `bootstrap-server.sh` (Docker, firewall, пользователь deploy, fail2ban); HTTPS (Let's Encrypt).
- **Файлы:** `deploy/scripts/bootstrap-server.sh`, `docs/deploy.md`.
- **✅ Готово, когда:** `https://<бренд>.by` открывает заглушку по HTTPS, сервер защищён по чек-листу.

### Step 7.7 — CI/CD и первый деплой
- **Что делаем:** GitHub Actions: `ci.yml` (lint, typecheck, test) и `deploy.yml` (сборка образа → GHCR → SSH: миграции → `docker compose up -d`); прод-env; регистрация Telegram-вебхука; UptimeRobot на `/api/health` с алертом в Telegram; Яндекс.Вебмастер + Google Search Console.
- **Файлы:** `.github/workflows/{ci,deploy}.yml`.
- **✅ Готово, когда:** push в `main` → сайт обновился за несколько минут; смоук-тест в проде пройден (витрина, бронь, заказ, Telegram, админка, загрузка фото с телефона).

### Step 7.8 — Юридический запуск и репетиция «Дропа»
- **Что делаем:** вносим реквизиты ИП и № Торгового реестра в настройки, финальные тексты оферты и политики ПД (после юриста), проходим юридический чек-лист ARCHITECTURE §12.2. E2E Playwright (путь покупателя и мастера), конкурентный тест брони на проде, финальный Lighthouse.
- **Файлы:** `e2e/*.spec.ts`, `playwright.config.ts`.
- **✅ Готово, когда:** чек-лист закрыт; 200 параллельных «Купить» → 1 заказ; Lighthouse mobile ≥ 90. 🎉 Первый дроп.

---

## Решения и открытые вопросы

### ✅ Принято
| Вопрос | Решение |
|---|---|
| Концепция и материалы | **Авторские текстильные куклы-феи и ангелы ручной работы** из эко-хлопка макраме, резного дерева, невесомого ромашкового фатина и мини-букетиков. Доступный подарочный сегмент 45–65 BYN. |
| Язык | Только русский, без i18n |
| Рынок / валюта | Беларусь, BYN |
| Доставка | Европочта, только по РБ |
| Домен | Исключительно **`.by`** (Указ № 60, транслит-URL) |
| Хостинг | VPS + S3 в РБ (hoster.by), домен `.by`. Обоснование — ARCHITECTURE §1, §14 |
| БД / Auth | Собственный PostgreSQL 18 + Drizzle + Better Auth (вместо Supabase) |
| Keep-alive | Не нужен; вместо него cron для броней, бэкапы, health-check |
| ИИ-генератор | **Google Gemini 1.5 Pro** по подписке Google AI Pro ($10/мес кредитов в комплекте, 0 BYN затрат, Cloudflare Worker proxy) |
| Фото на старте | Арт-моки с blur-эффектами; мастер загрузит реальные фото кукол позже через мобильную админку |
| Акцент | Терракота (основной), шалфей (вторичный) |
| Шрифты | Cormorant Garamond + Manrope (финально утверждаем на Step 1.2) |
| Концепция «Zero-IT UX» и Telegram-управление | Полное сокрытие технических полей (`slug`, `blur_data_url`, `sort_order`, `id`). Серверная автогенерация `slug` из названия. Новая кукла автоматически первая в каталоге. Управление фото без Drag-and-Drop (кнопки «⭐ Главное», «🗑️ Удалить», «◀ ▶»). Кликабельные чипы материалов в 1 клик. Форма в 1 экран + понятные статусы («🟢 Ищет дом», «🏡 Нашла дом», «✨ На заказ») + автосохранение черновиков. Интерактивные Inline-кнопки в Telegram для мгновенного подтверждения продажи («В архив») или отмены брони («В наличие») прямо из мессенджера без входа на сайт. |

| Стоимость доставки | Оплачивается покупателем отдельно: 3,50 BYN до отделения Европочты, 5,50 BYN курьером до двери; при заказе от 120 BYN — доставка за счет бутика. |
| БД / Драйвер / ORM | PostgreSQL 18 + Drizzle ORM + postgres.js, пул соединений под защитой `server-only`, строгая Zod-валидация env |

### ❓ Открыто
| # | Вопрос | Нужно к |
|---|---|---|
| 1 | Название бренда → домен `.by` (проверим варианты на Step 1.0) | Step 1.0 / 1.4 |
| 2 | Разрешать наложенный платёж для дорогих OOAK-кукол? | Step 5.2 |
| 3 | Платёжный провайдер и банк-эквайер для онлайн-оплаты (bePaid / Express-Pay / WebPay) | Фаза 6 |
| 4 | Консультация юриста или бухгалтера: оферта, политика ПД, Торговый реестр, касса при онлайн-оплате | До Step 7.8 |
