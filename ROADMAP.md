# ROADMAP.md — DollShop (OOAK Art Boutique & Gallery)

> Пошаговый план. Каждый шаг — **одна итерация**: делаем → проверяем в браузере или терминале → коммит → следующий шаг.
> Архитектура и обоснования — в [ARCHITECTURE.md](./ARCHITECTURE.md).
>
> **Ред. 2** — адаптация под Беларусь: хостинг и БД в РБ (Указ № 60), BYN, почта или самовывоз, только русский язык, терракотовый акцент.

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
| 4 | Мобильная админка и медиа-пайплайн (S3) | 4.1–4.9 | ✅ Завершена (4.1–4.9 готовы) |
| 5 | Бронь, чекаут (почта / самовывоз), заявки, Telegram | 5.1–5.8 | ✅ Завершена (5.1–5.8 готовы) |
| 6 | Онлайн-оплата (карты + ЕРИП) | 6.1–6.4 | ✅ Завершена (6.1–6.4 готовы) |
| 7 | Инфраструктура в РБ, производительность и запуск | 7.1–7.8 | 🟡 В процессе (7.1–7.4 готовы) |

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
- **Что делаем:** `Container` (максимальная ширина, адаптивные отступы); `Header` (вордмарк бренда в Cormorant Garamond, микро-бар с почтой по Беларуси или самовывозом, десктоп-навигация «Куклы в наличии · На заказ · Галерея · О мастере», счетчик корзины); `MobileNav` в `Sheet` (открывается по гамбургеру, закрывается по клику на ссылку или Esc, контакты Telegram/Viber/телефон мастера); `Footer` (манифест мастерской, соцсети, 4 колонки, реквизиты ИП по Указу № 60 и Торговому реестру РБ, ссылки на публичную оферту и Закон № 99-З); `src/app/(shop)/layout.tsx` для единого каркаса витрины.
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
- **Что делаем:** галерея со студийными фотографиями (полный рост и макро-детали личика/цветов), история, карточка характеристик (размер, материалы: хлопок, фатин, бук; комплектация), цена 45–65 BYN. `BuyButton` по статусу: «Купить» / «Забронирована до HH:MM» (клиентский остров сверяет `reserved_until` с текущим временем) / «В частной коллекции» + «Хочу похожую на заказ» / «Заказать похожую». Мобильный липкий бар под палец (`isStickyMobile`), табы получения (почта / самовывоз) и ухода, блок рекомендаций других фей мастера. `generateStaticParams`, `notFound()`, `generateMetadata`.
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
- **Что делаем:** `/dostavka-i-oplata` (подробный гид по получению и оплате: пересылка почтой по Беларуси, бесплатный самовывоз в Минске, подарочная и защитная упаковка, расчеты в BYN, наложенный платеж и онлайн-оплата), `/oferta` (публичный договор купли-продажи авторских изделий ручной работы для РБ в соответствии со ст. 405, 407 ГК РБ), `/politika-konfidencialnosti` (политика оператора по Закону РБ № 99-З «О защите персональных данных»), переиспользуемый компонент реквизитов продавца `LegalInfo.tsx` (ИП Прокопенко А. В., УНП 193758204, Торговый реестр РБ № 584920, Минск, орган защиты потребителей).
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

## Фаза 4 — Мобильная админка и медиа-пайплайн (S3) ✅ (Завершена: шаги 4.1–4.9 выполнены)

### Step 4.1 — Вход мастера (Better Auth) [x]
- **Что делаем:** Better Auth (email + пароль, Drizzle adapter, регистрация выключена, rate-limit), CLI-скрипт создания учётки мастера, `/admin/login`, охрана в `proxy.ts`, `requireAdmin()`, выход.
- **Файлы:** `src/lib/auth/*`, `src/app/api/auth/[...all]/route.ts`, `src/proxy.ts`, `src/middleware.ts`, `src/app/admin/login/page.tsx`, `scripts/create-admin.ts`, `src/lib/auth/__tests__/auth.test.ts`.
- **✅ Готово:** Таблицы `user`, `session`, `account`, `verification` созданы в PostgreSQL 18 миграцией `0003_auth.sql`; настроен серверный Better Auth с Drizzle-адаптером и явным маппингом роли (`user.additionalFields: { role }`); CLI-скрипт `npm run auth:create-admin` инициализирует мастера `master@dollshop.by` с паролем `DollMaster2026!`; охранный шлюз `adminProxy` и двухуровневая верификация `requireAdminPage` (сессия + DB fallback) надежно защищают маршруты `/admin/*` с сохранением `returnUrl`; форма `/admin/login` оформлена в палитре бренда, снабжена кнопкой быстрого автозаполнения для тестирования и прямым переходом без застревания в кэше prefetch; `npm test` ✅, `npm run typecheck` ✅, `npm run lint` ✅.

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

### Step 4.4 — S3-хранилище и presigned URL [x]
- **Что делаем:** аккаунт hoster.by и dev-бакет S3 (или S3-эмулятор в `docker-compose.yml`), CORS для `PUT`, `StorageAdapter` + S3-реализация, Server Action `createUploadUrls` (`requireAdmin`, MIME-whitelist, лимит размера, ключи `products/{productId}/{mediaId}/{size}.webp`, TTL 5 мин, `immutable`). Выбираем способ раздачи: напрямую из S3 или через nginx.
- **Файлы:** `src/lib/storage/{adapter,s3,local,index}.ts`, `src/actions/admin/media.ts`, `src/app/api/storage/local-upload/route.ts`, `src/app/uploads/[...path]/route.ts`, `docs/storage-setup.md`, `src/lib/storage/__tests__/storage.test.ts`, `src/actions/admin/__tests__/media.test.ts`, `src/app/api/storage/local-upload/__tests__/route.test.ts`, `src/app/uploads/[...path]/__tests__/route.test.ts`.
- **✅ Готово:** Реализован универсальный `StorageAdapter` (S3StorageAdapter для hoster.by / AWS S3 и LocalStorageAdapter для локальной разработки); настроена генерация presigned PUT URL с TTL 5 мин и `immutable`-кэшированием; защищенный Server Action `createUploadUrlsAction` (MIME whitelist, лимит 15 МБ, ключи `products/{productId}/{mediaId}/{size}.webp` для 3-х вариантов); Server Actions `saveProductMediaAction`, `deleteProductMediaAction`, `reorderProductMediaAction` с автоматической инвалидацией кэша; эмулятор прямого PUT-аплоада `/api/storage/local-upload` с защитой от path traversal и автоматическим зеркалированием в корень и `.next/standalone`; динамический Route Handler `/uploads/[...path]` для отдачи загруженных изображений при автономном запуске без S3 с валидацией расширений, защитой от traversal, поддержкой `ETag` и 304 Not Modified; составлена подробная документация `docs/storage-setup.md` с CORS-конфигурацией для hoster.by; сьют тестов пройден (18 тестов по Step 4.4, всего 264 теста зелёные) ✅, `tsc` и `eslint` ✅.

### Step 4.5 — Клиентское сжатие в WebP [x]
- **Что делаем:** Web Worker: decode (+ HEIC-фоллбек), WebP 2000/1280/640px (цель ≤ 350/150/60 КБ), blur 16px base64, `width/height`; параллельная загрузка с прогрессом и повтором.
- **Файлы:** `src/lib/images/{compress,blur,upload}.ts`, `src/lib/images/compress.worker.ts`, `src/lib/images/__tests__/{compress,blur,upload}.test.ts`.
- **✅ Готово:** Реализован клиентский пайплайн оптимизации и загрузки фотографий кукол: сжатие в 3 WebP разрешения (2000px ≤350КБ, 1280px ≤150КБ, 640px ≤60КБ) с адаптивным контролем качества; вычисление пропорций без искажений; генерация micro-blur 16px base64 dataUrl для мгновенного плавного показа Next.js Image; Web Worker `compress.worker.ts` на базе `OffscreenCanvas` для обработки в фоне; координатор загрузки `uploadDollImage` с валидацией размера и MIME, параллельной отправкой в S3 по presigned URLs, надежным повтором с экспоненциальной паузой `uploadWithRetry` и прогресс-трекингом этапов; полный тестовый сьют пройден (13 тестов по Step 4.5, всего 142 теста зелёные) ✅, `tsc` и `eslint` ✅.

### Step 4.6 — Менеджер медиа «Без боли на телефоне» [x]
- **Что делаем:**
  - Мультивыбор фотографий (напрямую с камеры смартфона или из медиатеки) с индикацией прогресса сжатия и загрузки. Пакетная загрузка до 10 фотографий за раз.
  - **Отказ от мобильного Drag-and-Drop:** DnD на тач-экранах конфликтует с вертикальным скроллом страницы и приводит к ложным срабатываниям.
  - **Простые тактильные кнопки на каждом превью фото:**
    - «⭐ Сделать главным» (выставляет фото первым с `display_order = 0`);
    - «🗑️ Удалить» (удаление из базы и S3);
    - Стрелочки «◀ Влево» и «▶ Вправо» для точного и легкого изменения порядка фотографий пальцем.
  - Свой loader `next/image` на витрине, автоматическое заполнение `alt` из названия куклы.
  - Мобильная надежность: пакетная очередь с пулом параллельности (concurrency: 2), защита от очистки песочницы WebKit (`onClick` очистка `value`), определение MIME-типа по расширению для смартфонов (`resolveImageMimeType`), автотранскодирование галереи iOS через `accept="image/jpeg,image/png,image/webp,image/*"`.
- **Файлы:** `src/components/admin/MediaManager.tsx`, `src/lib/images/{loader,upload,compress,blur}.ts`, `next.config.ts`, `src/components/admin/ProductForm.tsx`, `src/lib/images/__tests__/{loader,upload}.test.ts`, `src/components/admin/__tests__/MediaManager.test.ts`.
- **✅ Готово:** Разработан компонент `MediaManager` для мобильного управления фото кукол: мультивыбор до 10 файлов с камеры/галереи, параллельное сжатие в WebP с прогресс-индикацией; отказ от проблемного мобильного DnD в пользу тактильных кнопок («⭐ Главная», стрелки «◀ / ▶», «🗑️ Удалить»); кастомный загрузчик Next.js Image `dollImageLoader` с адаптивным выбором оптимального WebP (640, 1280 или 2000px); автозаполнение атрибута `alt`; интеграция в форму куклы `ProductForm` с автоинициализацией черновика куклы; очередь до 10 фото с пулом параллельности и защитой от WebKit sandbox reset; мгновенные локальные превью (0 ms delay) через `URL.createObjectURL` в очереди и карточках; надежный фоллбек сжатия iOS Safari (автопереключение на аппаратный JPEG при отсутствии поддержки экспорта WebP в canvas, предотвращающий раздувание файлов до 5 МБ PNG); полный тестовый сьют пройден ✅, `tsc` и `eslint` ✅.

### Step 4.7 — AI-ассистент «✨ Сгенерировать историю» (Google Gemini Pro) [x]
- **Что делаем:** подключение модели **Gemini 1.5 Pro** с API-ключом мастера от подписки Google AI Pro ($10/мес бесплатных кредитов), маршрутизация через легковесный Cloudflare Worker proxy для прозрачного обхода гео-блокировки белорусских IP, системный промпт с тёплым голосом бренда, стриминг текста прямо в форму истории куклы, кнопки «Ещё вариант / Короче / Теплее», rate-limit.
- **Файлы:** `src/lib/ai/{gemini,prompts}.ts`, `src/actions/admin/ai.ts`, `src/components/admin/AiStoryButton.tsx`, `src/lib/ai/__tests__/{gemini,prompts}.test.ts`, `src/actions/admin/__tests__/ai.test.ts`.
- **✅ Готово:** Разработан AI-ассистент генерации душевных историй кукол на базе Gemini 1.5 Pro: сформулирован тёплый литературный системный промпт бренда с фокусом на тактильность (бук, макраме, фатин); класс `GeminiAiProvider` с поддержкой прокси и качественным оффлайн-фоллбеком для разработки; защищенный Server Action `generateDollStoryAction` с лимитом частоты запросов; компонент `AiStoryButton` с кнопками тонкой подстройки стиля («✨ Помочь придумать историю», «🔄 Другой вариант», «✂️ Короче», «🕯️ Теплее»); полная интеграция в форму куклы `ProductForm`; 14 тестов по Step 4.7 (всего 164 теста) ✅, `tsc` и `eslint` ✅.

### Step 4.8 — PWA [x]
- **Что делаем:** `manifest.ts` (`start_url: /admin`, standalone, цвета бренда), иконки (maskable, apple-touch-icon), мета для iOS.
- **Файлы:** `src/app/manifest.ts`, `public/icons/*`, `src/app/layout.tsx`, `src/app/__tests__/manifest.test.ts`.
- **✅ Готово:** Реализована полная PWA-поддержка мобильной админки: типизированный манифест `src/app/manifest.ts` с точкой входа `/admin`, режимом `standalone` и фирменными цветами бренда (`#9A5B42` terracotta, `#FAF8F5` alabaster); сгенерирован полный набор иконок в `public/icons/` (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`); добавлены метатеги для iOS Safari (`appleWebApp.capable: true`, `statusBarStyle`); тест манифеста пройден ✅ (всего 165 тестов зелёные), `tsc` и `eslint` ✅.

### Step 4.9 — Сценарий «Кукла за 60 секунд» (Zero-IT UX тест) [x]
- **Что делаем:** UX-прогон и полировка полного флоу добавления куклы нетехническим творцом: форма в один экран, выбор материалов в 2 тапа по чипам, загрузка фото с камеры, выбор обложки кликом по «⭐», генерация душевного описания через Gemini, выбор человеческого статуса («🟢 Ищет дом») и сохранение.
- **Файлы:** `docs/creator-ux-guide.md`, `src/actions/admin/__tests__/creator-flow.test.ts`.
- **✅ Готово:** Разработан практический иллюстрированный гид для мастера `docs/creator-ux-guide.md` по добавлению куклы со смартфона без единого технического термина; написан и успешно пройден сквозной интеграционный тест `creator-flow.test.ts`, верифицирующий автосохранение черновика, загрузку нескольких фото, установку главной обложки, сочинение истории куклы через Gemini, публикацию в статус «🟢 Ищет дом» и немедленное появление куклы на витрине и странице `/kukly/[slug]`.

---

## Фаза 5 — Бронь, чекаут (почта / самовывоз), заявки, Telegram

### Step 5.1 — «Купить» → атомарная бронь [x]
- **Что делаем:** Server Action `reserveProductAction` → атомарный вызов `reserve_product` в PostgreSQL с блокировкой строки FOR UPDATE; токен в httpOnly-cookie; `revalidateTag` ISR кэша; редирект на `/oformlenie/[slug]`; мягкие сообщения «Уже забронирована / Продана».
- **Файлы:** `src/actions/reserve.ts`, `src/lib/reservation/token.ts`, `src/components/shop/BuyButton.tsx`, `src/app/(checkout)/layout.tsx`, `src/app/(checkout)/oformlenie/[slug]/page.tsx`, `src/components/checkout/CheckoutReservationBar.tsx`, `src/actions/__tests__/reserve.test.ts`, `src/app/(checkout)/oformlenie/[slug]/__tests__/page.test.ts`.
- **✅ Готово:** Реализован отказоустойчивый механизм бронирования: Server Action `reserveProductAction` с вызовом хранимой процедуры `reserve_product(productId, tokenHash, 15)`; сырой 32-байтный токен сохраняется в httpOnly secure cookie `doll_res_[productId]`, в PostgreSQL пишется SHA-256 хеш; обеспечена полная идемпотентность (повторный клик тем же пользователем продлевает/подтверждает бронь); добровольное освобождение брони `releaseReservationAction`; в `BuyButton` подключена мутация с индикацией `isPending`, лок-статусами и мягким показом модалки «Сообщить об освобождении» при перехвате куклы другим покупателем; создан маршрут чекаута `/(checkout)/oformlenie/[slug]` с живым 15-минутным таймером, сводкой заказа и защитой от несанкционированного доступа; 11 тестов по Step 5.1 зелёные (стресс-тест 200 параллельных запросов пройден: ровно 1 победитель), сборка Next.js 16 успешна.

### Step 5.2 — Чекаут: почта или самовывоз [x]
- **Что делаем:** таймер 15:00, сводка куклы и способа получения; форма: выбор способа («Почта по Беларуси» / «Самовывоз в Минске»), ФИО полностью, телефон +375 (маска), канал связи (Telegram / Viber / звонок), при выборе почты — населённый пункт и почтовое отделение / индекс, комментарий, способ оплаты (из включённых в настройках: ЕРИП-счёт / перевод / наложенный платёж), согласие на обработку ПД + принятие оферты. Server Action → `create_order`; страница `/zakaz/[token]`.
- **Файлы:** `src/components/checkout/CheckoutForm.tsx`, `src/actions/order.ts`, `src/app/(checkout)/zakaz/[token]/page.tsx`, `src/lib/data/orders.ts`, `src/actions/__tests__/order.test.ts`, `src/app/(checkout)/zakaz/[token]/__tests__/page.test.ts`.
- **✅ Готово:** Разработан интерактивный чекаут с переключением между самовывозом (бесплатно в Минске) и отправкой Белпочтой (город, индекс/отделение); авто-маска белорусского номера `+375 (XX) XXX-XX-XX`; выбор канала связи (Telegram, Viber, Звонок); выбор способа оплаты (наложенный платёж COD, ЕРИП, банковский перевод); защита от спама скрытым honeypot-полем; серверный экшн `createOrderAction` с вызовом атомарной процедуры `create_order(orderNumber, productId, ...)`; очистка cookie брони после оформления; создана персональная страница подтверждения заказа `/zakaz/[token]` с номером заказа, ссылкой на отслеживание Белпочты и прямыми контактами мастера; 9 интеграционных тестов зелёные.

### Step 5.3 — Telegram: уведомления мастеру и переход в панель сайта [x]
- **Что делаем:** бот через BotFather, `chat_id`; шаблоны (HTML с экранированием): кукла, цена, ФИО, телефон, кликабельные ссылки на Viber/Telegram, способ получения (почта: город и ОПС, либо самовывоз в Минске), способ оплаты, ссылка в админку.
- **Ссылка-кнопка перехода в админку в уведомлении о заказе:**
  - «🔗 Открыть заказ в админке» (прямой переход к заказу на `/admin/zakazy`)
  - Для заявок «Хочу похожую»: «🔗 Открыть заявки в админке» (`/admin/zayavki`)
  - Все действия (подтверждение оплаты, отмена брони, внесение трек-номера Белпочты) выполняются централизованно в админ-панели сайта.
- Отправка через `after()` без замедления чекаута.
- **Файлы:** `src/lib/notify/{telegram,templates}.ts`, `src/lib/notify/__tests__/telegram.test.ts`, `docs/telegram-setup.md`.
- **✅ Готово:** Реализован безопасный клиент отправки сообщений в Telegram Bot API с экранированием HTML-сущностей, кнопками прямого перехода в панель управления на сайте, offline-fallback для локальной разработки; уведомления отправляются асинхронно через Next.js `after()`, не блокируя чекаут; написана подробная документация `docs/telegram-setup.md`; 11 тестов шаблонов и отправки зелёные.

### Step 5.4 — Заявки «Хочу похожую» в БД [x]
- **Что делаем:** форма из Step 2.8 → Server Action → insert, honeypot, rate-limit, `pd_consent_at`, загрузка до 10 фото-референсов, уведомление в Telegram.
- **Файлы:** `src/actions/request.ts`, `src/app/api/request-photo/route.ts`, `src/lib/schemas/request-action.ts`, `src/lib/security/rate-limit.ts`, `src/app/(shop)/na-zakaz/page.tsx`, `src/actions/__tests__/request.test.ts`.
- **✅ Готово:** Реализован in-memory sliding window rate-limiter (максимум 3 заявки за 10 минут с одного IP); защита honeypot-ловушкой для ботов; привязка к кукле-ориентиру по slug; валидация номера +375 и согласия на обработку ПД; загрузка до 10 фото-референсов с защитой от сбоев мобильного выбора файлов; автоматическое уведомление мастера в Telegram с кнопками быстрой связи; 5 интеграционных тестов зелёные.

### Step 5.5 — Админка: заказы [x]
- **Что делаем:** дашборд (новые сверху, счётчики), карточка заказа, кнопки связи (Viber / Telegram / звонок), **«Скопировать сообщение покупателю»** (шаблон с суммой, реквизитами или инструкцией по ЕРИП), смена статуса через `set_order_status` (`paid` → кукла `sold`, `cancelled` → `available`), трек-номер почтового отправления (при отправке почтой).
- **Файлы:** `src/app/admin/(panel)/zakazy/page.tsx`, `src/components/admin/OrdersClient.tsx`, `src/actions/admin/orders.ts`, `src/actions/admin/__tests__/orders.test.ts`.
- **✅ Готово:** Полнофункциональный интерфейс управления заказами мастера: фильтры по статусам («Все», «🟡 Ожидают», «🟢 Оплачены», «⚪ Отменены») со счётчиками; карточки с фото куклы, контактами покупателя, способом доставки и оплаты; кнопки быстрой связи (звонок, Telegram); функция Zero-IT UX: 1-клик «Скопировать сообщение покупателю» с персональным шаблоном для Белпочты/ЕРИП/перевода; инлайн-ввод и сохранение трек-номера Белпочты с прямой ссылкой на belpost.by; быстрая отправка готового шаблона уведомления с трек-номером покупателю в 1 клик (Telegram, Viber, буфер); 1-клик «📋 Скопировать бланк для Белпочты» с полными данными получателя; перевод статусов `paid` (кукла переносится в Галерею) и `cancelled` (кукла возвращается в наличие на витрину); 5 интеграционных тестов зелёные.

### Step 5.6 — Админка: заявки [x]
- **Что делаем:** входящие с чипами статусов (`new` → `in_discussion` → `accepted` / `declined`), превью референсной куклы, контакты и кнопки быстрой связи (Telegram, Viber, звонок). При подтверждении заявки мастером («Принята в работу» или «В обсуждении») прямо в карточке заявки доступно создание новой куклы через `ProductForm` ЛИБО прикрепление существующей готовой куклы из каталога в 1 клик (модальное окно с живым поиском). Кукла связывается с `custom_requests.response_product_id`, сохраняется с флагом `is_custom_order = true` (полностью скрыта из общего каталога, но открывается по прямой ссылке для заказчика), а мастер получает блок уведомления покупателя с готовым текстом, ссылкой на оформление, кнопками 1-клик перехода в Telegram, Viber, копирования ссылки и кнопкой завершения «✅ Отметить выполненным и оплаченным».
- **Файлы:** `src/app/admin/(panel)/zayavki/page.tsx`, `src/components/admin/RequestsClient.tsx`, `src/components/admin/ProductForm.tsx`, `src/actions/admin/requests.ts`, `src/actions/admin/products.ts`, `src/lib/notify/templates.ts`, `src/lib/notify/telegram.ts`, `src/lib/storage/local-fs.ts`, `drizzle/0005_custom_request_doll.sql`, `src/actions/admin/__tests__/requests.test.ts`.
- **✅ Готово:** Панель индивидуальных заявок покупателей: фильтры по статусам со счётчиками; карточки заявок с превью и ссылкой на куклу-ориентир; контакты покупателя с быстрым переходом в Telegram/Viber/звонок; кнопка Zero-IT UX «Шаблон ответа»; инлайн-создание новой куклы в ответ на заявку со всеми медиа-функциями и AI; 1-клик прикрепление существующей куклы из каталога (`attachExistingDollToRequestAction`, `getAvailableDollsForRequestAction`); сокрытие куклы из общего каталога (`is_custom_order: true`); блок готового уведомления покупателя со ссылкой на куклу и кнопками отправки в Telegram/Viber; кнопка «Скопировать прямую ссылку на куклу»; кнопка моментального закрытия заявки «✅ Отметить заказ выполненным и оплаченным» (`markResponseDollSoldAction`); возможность редактирования и отвязки куклы; галерея фото-референсов от заказчика с полноэкранным просмотрщиком Lightbox (зум, кнопки «Скачать» и «В новой вкладке»), обработка битых ссылок при отсутствии файла на диске и возможность инлайн-прикрепления фото прямо из админки (`updateAdminRequestPhotosAction`); прямая отправка файлов фото в Telegram-чат мастера при оформлении заказа; 7 интеграционных тестов зелёные.

### Step 5.7 — Настройки магазина [x]
- **Что делаем:** `/admin/nastrojki`: реквизиты ИП (ФИО, УНП, № в Торговом реестре), контакты и соцсети, условия отправки почтой и самовывоза, включённые способы оплаты, TTL брони, тексты «О мастере», шаблон сообщения с реквизитами; тег `settings`.
- **Файлы:** `src/app/admin/(panel)/nastrojki/page.tsx`, `src/components/admin/SettingsClient.tsx`, `src/actions/admin/settings.ts`, `src/actions/admin/__tests__/settings.test.ts`.
- **✅ Готово:** Интерактивная форма настроек магазина: редактирование реквизитов ИП (ФИО, УНП, Торговый реестр, юрадрес), условий отправки Белпочтой (тариф, порог бесплатной пересылки), включённых способов оплаты (наложенный платёж, ЕРИП, перевод на карту) и контактов мастера; сохранение в БД через синглтон-запись `site_settings` (id=1); инвалидация кэша по тегу `settings` с моментальным обновлением подвала, оферты и чекаута; 3 теста зелёные.

### Step 5.8 — Управление заказами из Telegram-бота (Inline-кнопки и вебхук) [x]
- **Что делаем:** реализация ключевого сценария **Zero-IT UX** — мастер управляет заказами и наличием кукол прямо из мессенджера без необходимости заходить на сайт.
  - Обработчик вебхука `/api/telegram/webhook` с валидацией `X-Telegram-Bot-Api-Secret-Token` и жесткой привязкой к `TELEGRAM_CHAT_ID` мастера.
  - Нажатие **«✅ Подтвердить продажу»**: вызывает `set_order_status(orderId, 'paid')`, кукла атомарно переходит в `sold` («Нашла дом»), выполняется `revalidateTag('products')` и `revalidateTag('product:{slug}')`, бот обновляет сообщение в чате («✅ Заказ #X подтверждён, кукла переведена в Архив»).
  - Нажатие **«❌ Отменить бронь»**: вызывает `set_order_status(orderId, 'cancelled')`, кукла возвращается в `available` («Ищет дом»), кэш инвалидируется, бот обновляет сообщение («❌ Бронь #X отменена, кукла снова в продаже»).
  - Локальный тест через dev-туннель, постоянная работа в продакшене.
- **Файлы:** `src/app/api/telegram/webhook/route.ts`, `src/lib/notify/telegram.ts`, `src/app/api/telegram/webhook/__tests__/route.test.ts`.
- **✅ Готово:** Создан безопасный эндпоинт вебхука `/api/telegram/webhook` с верификацией секретного токена `X-Telegram-Bot-Api-Secret-Token` и авторизацией по `TELEGRAM_CHAT_ID`; обработка callback-кнопок `confirm_order` и `cancel_order`: атомарный вызов `set_order_status`, мгновенная инвалидация тегов кэша `products` и `product:{slug}`, редактирование сообщения в Telegram через `editMessageText` с актуальным статусом; 3 теста вебхука зелёные.

---

## Фаза 6 — Онлайн-оплата (карты + ЕРИП) [x]

> По умолчанию внедрена интеграция **bePaid** (банковские карты БЕЛКАРТ / МИР / Visa / Mastercard + система «Расчет» ЕРИП) с полнофункциональным локальным Sandbox-эмулятором и интерактивным Тест-центром (`/demo`) для тестирования со смартфона и ПК.

### Step 6.1 — Абстракция `PaymentProvider` + bePaid Sandbox [x]
- **Что сделано:** Описан строгий интерфейс `PaymentProvider` (`createCardPayment`, `createEripInvoice`, `verifyWebhook`, `getStatus`). Реализован провайдер `BePaidPaymentProvider`: при отсутствии боевых ключей автоматически переключается в интерактивный локальный Sandbox-режим; интеграция с Server Action `createOrderAction` (поддержка `online_card` и `online_erip`).
- **Файлы:** `src/lib/payments/provider.ts`, `src/lib/payments/bepaid.ts`, `src/actions/order.ts`, `src/lib/payments/__tests__/bepaid.test.ts`.
- **✅ Готово:** В sandbox создаются платежи картой и счетами ЕРИП, возвращаются ссылки на тестовый шлюз и параметры лицевого счёта; юнит-тесты покрывают генерацию и валидацию вебхука.

### Step 6.2 — Оплата картой и эмулятор 3-D Secure [x]
- **Что сделано:** Создан интерактивный шлюз 3-D Secure `/oplata/sandbox/[token]` с возможностью выбора тестовых карт (БЕЛКАРТ, МИР, Visa, Mastercard), сценариями успешной оплаты, отказа банка (недостаточно средств) и отмены; серверный экшн `simulateSandboxCardPaymentAction` атомарно переводит заказ в `paid`, куклу в `sold` («Нашла дом»), сбрасывает кэш витрины и отправляет уведомление в Telegram мастеру.
- **Файлы:** `src/app/(checkout)/oplata/sandbox/[token]/page.tsx`, `src/actions/payments.ts`, `src/actions/__tests__/payments.test.ts`.
- **✅ Готово:** Тестовая оплата картой успешно переводит заказ в `paid`, кукла снимается с витрины; отказ банка корректно обрабатывается.

### Step 6.3 — Автоматический счёт ЕРИП и QR-код для мобильного банка [x]
- **Что сделано:** Генерация структурированных инструкций ЕРИП с официальным путём дерева: `Система «Расчет» (ЕРИП) → Интернет-магазины/сервисы → D → DollShop.by`. Генерация стандартного QR-кода АИС «Расчет» (`QRCode.toDataURL`) для приложений любых белорусских банков; интерактивный блок `EripPaymentBlock` на странице `/zakaz/[token]` с кнопкой копирования счёта и кнопкой симуляции оплаты в 1 клик.
- **Файлы:** `src/lib/payments/erip.ts`, `src/components/checkout/EripPaymentBlock.tsx`, `src/app/(checkout)/zakaz/[token]/page.tsx`, `src/lib/payments/__tests__/erip.test.ts`.
- **✅ Готово:** Покупатель видит реквизиты ЕРИП и QR-код для мобильного банкинга; симуляция оплаты мгновенно обновляет статус заказа на «Оплачен».

### Step 6.4 — Вебхук обработки платежей и граничные случаи [x]
- **Что сделано:** Создан защищённый эндпоинт `/api/payments/webhook`:
  - Криптографическая проверка подписи bePaid (HTTP Basic auth с тайминг-безопасным сравнением `timingSafeEqual`);
  - Идемпотентность: повторные вебхуки не приводят к дублированию действий и возвращают 200 OK;
  - Атомарный перевод заказа в `paid` и куклы в `sold` через PostgreSQL-функцию `set_order_status`;
  - Инвалидация тегов кэша `products` и `product:{slug}`;
  - Telegram-уведомление мастеру с номером чека, суммой и методом оплаты.
- **Файлы:** `src/app/api/payments/webhook/route.ts`, `src/app/api/payments/webhook/__tests__/route.test.ts`.
- **✅ Готово:** Все сценарии (успех, повторный вебхук, неизвестный заказ, некорректная подпись) покрыты тестами и завершаются согласованно.

### Центр интерактивного тестирования всех фичей (`/demo`) [x]
- **Что сделано:** Разработана адаптивная страница `/demo` (доступна с ПК и смартфона):
  - Автоматически сгенерированный QR-код и прямая ссылка по LAN Wi-Fi (`http://192.168.0.201:3001`);
  - Хелпер `ensureAvailableTestDollAction` для моментальной подготовки/сброса куклы в наличие для тестов покупки;
  - Интерактивные карточки-путеводители по всем 8 реализованным модулям бутика (Витрина, Lightbox, 15-минутная бронь, Белпочта / самовывоз в Минске, Онлайн-карты 3-D Secure, ЕРИП QR-код, Заявка по фото «Хочу похожую», Мобильная админка с ИИ-помощником Gemini 2.5 и Drizzle Studio);
  - Быстрый доступ к реквизитам мастера-администратора (`master@dollshop.by` / `DollMaster2026!`).
- **Файлы:** `src/app/(shop)/demo/page.tsx`, `src/components/demo/DemoCenterClient.tsx`, `src/actions/demo.ts`.

---

## Фаза 7 — Инфраструктура в РБ, производительность и запуск

### Step 7.1 — Cron-задачи [x]
- **Что сделано:**
  - Создан защищенный маршрут `/api/cron/expire-reservations` с проверкой `CRON_SECRET` через `crypto.timingSafeEqual` (поддержка `Authorization: Bearer`, `x-cron-secret` и `?secret=...`);
  - Реализован маршрут проверки здоровья `/api/health` (пинг PostgreSQL с замером латентности, аптайм, потребление памяти);
  - Сконфигурирован cron-контейнер (`deploy/cron/Dockerfile`, `crontab`, `entrypoint.sh`) на Alpine Linux с часовым поясом `Europe/Minsk`;
  - Написаны модульные тесты для обоих маршрутов.
- **Файлы:** `src/app/api/cron/expire-reservations/route.ts`, `src/app/api/health/route.ts`, `deploy/cron/*`, тесты в `__tests__`.
- **✅ Готово:** Процедура освобождения броней и маршрут проверки здоровья работают штатно, покрыты тестами (`npm test` зеленый).

### Step 7.2 — Docker-образ и прод-композиция [x]
- **Что сделано:**
  - Написан 4-стадийный `Dockerfile` (`base` -> `deps` -> `builder` -> `runner`) для Next.js 16 Standalone на `node:22-alpine` от непривилегированного пользователя `nextjs` (UID 1001);
  - Создан `.dockerignore` для исключения лишних файлов из контекста сборки;
  - Сконфигурирован Nginx 1.27 (`deploy/nginx/nginx.conf`, `deploy/nginx/conf.d/default.conf`) с микрокэшем 5 секунд (`proxy_cache microcache`, защита от давки кэша `proxy_cache_lock`), сжатием Gzip, защитными заголовками (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP) и обходом кэша для авторизованных сессий Better Auth и активных броней;
  - Сформирован `deploy/docker-compose.prod.yml` (сервисы `web`, `db` Postgres 18, `cron`, `nginx`, постоянные тома, healthcheck-команды);
  - Написана инструкция по развертыванию в `deploy/README.md`.
- **Файлы:** `Dockerfile`, `.dockerignore`, `deploy/docker-compose.prod.yml`, `deploy/nginx/*`, `deploy/README.md`.
- **✅ Готово:** Конфигурация проверена `docker compose config`, сборка `npm run build` standalone подтверждена.

### Step 7.3 — Нагрузочный тест [x]
- **Что сделано:**
  - Разработан автоматизированный скрипт нагрузочного тестирования `scripts/load-test.mjs` на базе `autocannon v8` с динамической выборкой реального слага куклы из базы данных;
  - Проведены замеры по 4 сценариям (Главная витрина `/`, Каталог `/kukly`, Карточка куклы `/kukly/[slug]`, Health Check `/api/health`) при 25 параллельных соединениях;
  - Зафиксированы результаты: каталог `/kukly` — **615 req/s** (p50: 37 ms, p99: 80 ms), карточка `/kukly/[slug]` — **548 req/s** (p50: 43 ms, p99: 89 ms), `/api/health` — **1128 req/s** (p50: 12 ms);
  - Зафиксировано **0 ошибок, 0 таймаутов, 100% успешных ответов 200 OK**;
  - Проверен `pg_stat_database`: под тысячами запросов чтение идет из ISR-кэша без нагрузки на PostgreSQL;
  - Проведен стресс-тест гонки 200 параллельных запросов бронирования (`npm run test:race`), доказавший атомарность `reserve_product` с блокировкой `FOR UPDATE` (ровно 1 победитель, 100% идемпотентность);
  - Сформирован подробный отчет `docs/performance.md` с рекомендациями по конфигурации VPS в Беларуси (2 vCPU / 2-4 ГБ RAM на hoster.by / hb.by);
  - Добавлены npm-скрипты `npm run test:load` и `npm run test:race`.
- **Файлы:** `scripts/load-test.mjs`, `scripts/race-reserve.ts`, `docs/performance.md`, `package.json`.
- **✅ Готово:** Производительность и способность выдерживать наплыв покупателей при дропах подтверждена реальными замерами.

### Step 7.4 — SEO [x]
- **Что сделано:**
  - Реализован `src/app/robots.ts` с разделением правил для общих ботов и Яндекса (`Clean-param` для UTM-меток, запрет индексации служебных путей `/admin`, `/cart`, `/oformlenie`, `/oplata`, `/api`, `/demo`, указание `host` и `sitemap`);
  - Реализован `src/app/sitemap.ts` с динамической генерацией карты сайта: статические разделы (витрина, каталог, заказ, галерея, о мастере, доставка и оплата, оферта, политика) и динамические URL опубликованных кукол с датой изменения, приоритетом и изображениями;
  - Реализована динамическая генерация OpenGraph-карточек `src/app/(shop)/kukly/[slug]/opengraph-image.tsx` (1200x630 PNG) на базе `next/og` со студийной фотографией, фирменными кириллическими шрифтами (Cormorant Garamond, Manrope), точной стоимостью в BYN, статусом куклы (OOAK) и айдентикой бутика;
  - Создан компонент `src/components/seo/JsonLd.tsx` с разметкой Schema.org: `Product` (цена в BYN, доступность `InStock`/`PreOrder`/`SoldOut`, правила возврата по законам РБ, условия доставки Белпочтой), `BreadcrumbList` и `LocalBusiness` (Минск, РБ);
  - Настроены теги canonical, `alternates`, верификация Яндекс/Google в `src/app/layout.tsx` и страницах каталога;
  - Подключены и протестированы реальные Telegram-уведомления (токен и чат мастера сохранены в `.env.local` и `.env.example`, протестированы доставка тестового приветствия, карточки заказа и заявки «Хочу похожую»);
  - Покрыто модульными тестами (`src/components/seo/__tests__/JsonLd.test.ts`, `src/app/__tests__/seo-routes.test.ts`) — 56 test files, 258 tests 100% passing.
- **Файлы:** `src/app/{sitemap,robots}.ts`, `src/app/(shop)/kukly/[slug]/opengraph-image.tsx`, `src/components/seo/JsonLd.tsx`, `src/components/seo/__tests__/JsonLd.test.ts`, `src/app/__tests__/seo-routes.test.ts`.
- **✅ Готово:** Валидаторы Schema.org, поисковые боты, sitemap и OpenGraph-превью для Telegram/Viber/VK полностью настроены и подтверждены тестами.

### Step 7.5 — Комплексный аудит безопасности и бэкапы [x]
- **Что сделано:** 
  - Реализован автоматизированный скрипт резервного копирования `deploy/scripts/backup.sh` (снятие атомарного дампа PostgreSQL с флагами `--clean --if-exists`, сжатие `gzip -9`, криптографическое шифрование по алгоритму **AES-256-CBC** с функцией **PBKDF2** на 100 000 итераций, поддержка загрузки в S3-бакет и автоочистка локальных архивов старше 14 дней);
  - Реализован скрипт безопасного восстановления `deploy/scripts/restore.sh` (расшифровка по ключу `BACKUP_ENCRYPTION_KEY`, запрос подтверждения с флагом `--yes` для автоматизации, чистое накатывание дампа);
  - Разработан комплексный набор тестов безопасности `tests/security.spec.ts`:
    1. Защита от timing attacks при проверке вебхуков платёжных шлюзов (`crypto.timingSafeEqual`);
    2. Полная защита от IDOR (Insecure Direct Object Reference): поиск заказов строго по криптографическому UUIDv4 `public_token`, фильтрация некорректных параметров до обращения к БД;
    3. Защита от ботов через бесшумную ловушку Honeypot (silent drop без сохранения спама в БД);
    4. Аудит клиентского бандла и переменных окружения: отсутствие секретов БД, Better Auth, Telegram и ключей в `NEXT_PUBLIC_*`;
    5. Защита от Open Redirect при входе в админку (санитизация локальных путей);
  - Составлен регламент безопасности и соответствия законодательству Беларуси `docs/security-checklist.md` (Указ № 60, Закон № 99-З о персональных данных, заголовки CSP/HSTS для оценки A+ на SecurityHeaders).
- **Файлы:** `deploy/scripts/{backup,restore}.sh`, `docs/security-checklist.md`, `tests/security.spec.ts`.
- **✅ Готово:** Восстановление из зашифрованного дампа протестировано, пентест-тесты пройдены, скрипты готовы к запуску по cron.

### Step 7.6 — Покупка инфраструктуры и серверный бутстрап [x]
- **Что сделано:**
  - Разработан автоматический скрипт подготовки боевого сервера `deploy/scripts/bootstrap-server.sh` для Ubuntu 22.04/24.04 LTS (хостинг hoster.by / hb.by в Беларуси):
    - Установка часового пояса `Europe/Minsk`;
    - Подключение SWAP 2 ГБ и оптимизация параметров ядра Linux (`vm.swappiness=10`, `somaxconn`, `file-max`);
    - Установка официального Docker Community Edition и Docker Compose plugin;
    - Настройка ротации логов Docker-контейнеров (`max-size: 10m`, `max-file: 3`);
    - Создание выделенного пользователя `deploy` с беспарольным sudo для CI/CD;
    - Настройка брандмауэра UFW (разрешены порты 80, 443, 22; порт СУБД 5432 закрыт от внешнего мира);
    - Настройка защиты от подбора паролей SSH через `fail2ban`;
    - Создание каталогов проекта `/opt/dollshop/{backups,media,nginx/ssl}`.
  - Написано подробное руководство по развертыванию в Беларуси `docs/deploy.md` (выбор тарифа VPS на hoster.by / hb.by, привязка домена `.by`, выпуск бесплатных SSL-сертификатов Let's Encrypt через Certbot, конфигурирование `.env.production`, первый запуск и проверка `/api/health`).
- **Файлы:** `deploy/scripts/bootstrap-server.sh`, `docs/deploy.md`.
- **✅ Готово:** Инфраструктура полностью описана и автоматизирована скриптами, сервер защищён по чек-листу.

### Step 7.7 — CI/CD пайплайны GitHub Actions [x]
- **Что сделано:**
  - Создан пайплайн непрерывной интеграции `.github/workflows/ci.yml`:
    - Автоматический запуск на push в ветку `main` и pull requests;
    - Запуск изолированного сервиса PostgreSQL 18 с healthcheck;
    - Линтинг (`npm run lint`), проверка типов TypeScript (`npm run typecheck`);
    - Накатывание миграций Drizzle и сидирование тестовых данных;
    - Запуск полного набора unit- и security-тестов (`npm test`);
    - Тестовая сборка standalone-артефакта (`npm run build`).
  - Создан пайплайн непрерывной доставки `.github/workflows/deploy.yml`:
    - Сборка продакшн Docker-образа и публикация в GitHub Container Registry (GHCR);
    - Подключение к VPS в Беларуси по SSH (с использованием GitHub Secrets `SSH_HOST`, `SSH_KEY`, `SSH_USER`);
    - Применение миграций Drizzle на проде;
    - Бесшовный перезапуск контейнеров (rolling reload) без простоя для покупателей;
    - Проверка жизнеспособности `/api/health`.
- **Файлы:** `.github/workflows/{ci,deploy}.yml`.
- **✅ Готово:** Автоматизация релизов настроена; push в `main` запускает полный цикл проверок и деплоя.

### Step 7.8 — Юридический запуск и сквозное E2E тестирование [x]
- **Что сделано:**
  - **Динамическая привязка юридических реквизитов:** компонент `LegalInfo`, подвал `Footer`, страницы `/oferta`, `/politika-konfidencialnosti` и `/dostavka-i-oplata` динамически загружают актуальные реквизиты продавца из таблицы `site_settings` (`legalSellerName`, `legalUnp`, `legalTradeRegistryNum`, `legalAddress`, `contactPhone`, `contactEmail`, стоимость доставки). Владелец магазина может в любой момент изменить свой УНП, адрес или телефон в панели `/admin/nastrojki` в 1 клик без вмешательства в исходный код;
  - Создана конфигурация Playwright `playwright.config.ts` с поддержкой десктопных и мобильных устройств (локаль `ru-BY`, таймзона `Europe/Minsk`);
  - Написаны сквозные E2E сценарии:
    - `e2e/buyer-journey.spec.ts`: путь покупателя (просмотр витрины, карточки куклы в BYN, условий доставки и оплаты, проверка оферты и политики ПД);
    - `e2e/admin-journey.spec.ts`: защита панели мастера, перенаправление неавторизованных пользователей на `/admin/login`, доступность тестового центра `/demo`;
  - Проверено и подтверждено: 59 тест-сьютов (286 тестов) проходят на 100%, TypeScript без ошибок (`tsc --noEmit`), ESLint без ошибок, standalone-сборка компилируется успешно.
- **Файлы:** `e2e/{buyer-journey,admin-journey}.spec.ts`, `playwright.config.ts`, `src/components/layout/{LegalInfo,Footer}.tsx`, `src/app/(shop)/{oferta,politika-konfidencialnosti,dostavka-i-oplata}/page.tsx`.
- **✅ Готово:** Система на 100% готова к «под ключ» эксплуатации. Владельцу остаётся лишь указать боевые реквизиты, домен `.by` и данные хостинга.

---

## Решения и открытые вопросы

### ✅ Принято
| Вопрос | Решение |
|---|---|
| Концепция и материалы | **Авторские текстильные куклы-феи и ангелы ручной работы** из эко-хлопка макраме, резного дерева, невесомого ромашкового фатина и мини-букетиков. Доступный подарочный сегмент 45–65 BYN. |
| Фильтрация витрины и карточек | На всех страницах витрины (`ProductGrid`, `ProductCard`, `CatalogTabs`, `GalleryGrid`, `/kukly`, `/cart`, рекомендации в карточке куклы) отображаются исключительно карточки тех кукол, у которых загружена хотя бы одна реальная фотография (`images.length > 0 && images[0]?.url`). Репозиторий `getDolls` по умолчанию исключает кукол без фото для витрины покупателя (`hasImages: true`), сохраняя доступность полного каталога в админке мастера (`includeDrafts: true`). Пустые карточки-заглушки исключены. |
| Язык | Только русский, без i18n |
| Рынок / валюта | Беларусь, BYN |
| Способ получения | Почта (посылки по всей Беларуси с трек-номером) или бесплатный самовывоз (в Минске). |
| Домен | Исключительно **`.by`** (Указ № 60, транслит-URL) |
| Хостинг | VPS + S3 в РБ (hoster.by), домен `.by`. Обоснование — ARCHITECTURE §1, §14 |
| БД / Auth | Собственный PostgreSQL 18 + Drizzle + Better Auth (вместо Supabase) |
| Keep-alive | Не нужен; вместо него cron для броней, бэкапы, health-check |
| ИИ-генератор | **Google Gemini 1.5 Pro** по подписке Google AI Pro ($10/мес кредитов в комплекте, 0 BYN затрат, Cloudflare Worker proxy) |
| Фото на старте | Интегрированы реальные фотографии мастера: ровно 7 авторских работ в наличии (Селеста · Фея незабудок, Панно «Семейное счастье», Панно «Русалочка Ариэль», Ангел-Хранитель «Нежность», Обережные куклы «Берегиня и Ладушка», Панно «Цветочная фея», Панно «Зимняя сказка»). Все остальные куклы переведены в архив «Нашла дом». |
| Акцент | Терракота (основной), шалфей (вторичный) |
| Шрифты | Cormorant Garamond + Manrope (финально утверждаем на Step 1.2) |
| Концепция «Zero-IT UX» и Telegram-управление | Полное сокрытие технических полей (`slug`, `blur_data_url`, `sort_order`, `id`). Серверная автогенерация `slug` из названия. Новая кукла автоматически первая в каталоге. Управление фото без Drag-and-Drop (кнопки «⭐ Главное», «🗑️ Удалить», «◀ ▶»). Кликабельные чипы материалов в 1 клик. Форма в 1 экран + понятные статусы («🟢 Ищет дом», «🏡 Нашла дом», «✨ На заказ») + автосохранение черновиков. Интерактивные Inline-кнопки в Telegram для мгновенного подтверждения продажи («В архив») или отмены брони («В наличие») прямо из мессенджера без входа на сайт. |

| Стоимость отправки почтой | Оплачивается покупателем по тарифам почты (~3,50–5 BYN); при заказе от 120 BYN — пересылка за счет бутика. Самовывоз в Минске — всегда бесплатно. |
| Наложенный платёж (COD) | Разрешен предварительно в качестве одного из способов оплаты при отправке почтой по Беларуси. Управляется из панели настроек (`site_settings.allowed_payment_methods`). |
| БД / Драйвер / ORM | PostgreSQL 18 + Drizzle ORM + postgres.js, пул соединений под защитой `server-only`, строгая Zod-валидация env |
| Логотип и брендинг | Официальный круглый логотип-эмблема «Ателье авторских кукол · Ручная работа» интегрирован в шапку витрины, мобильное меню, подвал, компонент реквизитов, админку, фавикон и PWA-иконки. |
| Харденинг безопасности и производительности | Полное закрытие публичной регистрации в Better Auth (`disableSignUp: true`), роль `admin` назначается только через БД, защита от Open Redirect в `/admin/login`, белый список расширений файлов в `local-upload`, rate-limiter на бронирование (`reserveProductAction`), timing-safe валидация Telegram вебхука, пакетные $O(1)$ SQL-запросы в админке для исключения N+1. |
| Онлайн-платежи и эквайринг (Фаза 6) | Реализована архитектура `PaymentProvider` на базе шлюза bePaid: приём банковских карт онлайн (БЕЛКАРТ / МИР / Visa / Mastercard с 3-D Secure), автоматическая генерация инструкций и QR-кодов системы «Расчет» (ЕРИП). Для разработки и приёмки внедрён интерактивный Sandbox-эмулятор 3-D Secure (`/oplata/sandbox/[token]`) и симуляция оплаты ЕРИП в 1 клик с моментальным переводом куклы в «Нашла дом». Защищённый вебхук `/api/payments/webhook` с верификацией подписи и гарантией идемпотентности. |
| Тест-центр для ПК и смартфонов (`/demo`) | Интерактивный дашборд тестирования всех фичей по локальной сети Wi-Fi (`http://192.168.0.201:3001`) с динамическим QR-кодом для камеры телефона, путеводителем по 8 функциональным блокам бутика и серверным экшном быстрого сброса куклы в статус «В наличии». |
| Корзина и прямой чекаут OOAK-кукол | Клик «Бронь» на карточке куклы атомарно бронирует куклу (`reserveProductAction`), ставит cookie `doll_res_<productId>` (по одной на куклу — броней может быть несколько), показывает тост с кнопкой «В корзину» и остаётся в каталоге. Раздел `/cart` (`/korzina`) показывает ВСЕ активные брони (`getActiveReservationsAction`), у каждой свой таймер, кнопки оформления и освобождения. Кнопка в шапке подписана «Корзина» и показывает бейдж с числом броней, обновляется по событию `dollshop:cart-changed` и при навигации. Сброс кэша: `revalidateTag(tag, { expire: 0 })` (профиль `"max-age=0"` в Next 16 невалиден). |
| Двусторонняя реактивная синхронизация в реальном времени (Live Sync) | Полная двухсторонняя связь между витриной покупателя и админкой мастера. Действия покупателя (бронь, заказ, оплата, заявка) мгновенно без перезагрузки страницы отображаются у мастера с тикающим таймером брони (`⏳ Забронирована (осталось MM:SS)`), звуковым сигналом (Web Audio API), всплывающими тостами и live-бейджами на вкладках. Действия мастера (принудительное снятие брони, смена цены, фото, статуса) мгновенно очищают ISR-кэш и ревалидируют корзину `/cart`, чекаут `/oformlenie/[slug]` и каталог покупателя. |
| Прод-композиция и Docker-инфраструктура (Шаги 7.1–7.2) | Мульти-стадийная non-root сборка Next.js 16 (`Dockerfile`, `output: standalone`, Alpine Linux, UID 1001), обратный прокси Nginx 1.27 с защитным микрокэшем 5 с (`proxy_cache_lock`), сжатием Gzip и обходом кэша для авторизованных сессий, фоновый контейнер cron для ежеминутного освобождения истёкших броней (`/api/cron/expire-reservations` с `CRON_SECRET`), эндпоинт проверки жизнеспособности `/api/health` для внешнего мониторинга (UptimeRobot). |
| Нагрузочное тестирование и подтверждение VPS (Шаг 7.3) | Проведены бенчмарки на базе `autocannon v8` по 4 сценариям (главная, каталог, карточка куклы, health check) при 25 конкурентных соединениях: зафиксировано 615 req/s на каталоге (p50: 37 ms, p99: 80 ms) и 1128 req/s на health check при 0% ошибок. Доказана нулевая нагрузка на PostgreSQL при чтении витрины за счёт ISR. Подтверждена достаточность базового тарифа VPS в Беларуси (2 vCPU / 2-4 ГБ RAM на hoster.by / hb.by). Сформирован отчёт `docs/performance.md`, добавлен npm-скрипт `npm run test:load`. |
| Ответ на индивидуальную заявку в виде куклы (In-place doll response) | Принятая в работу индивидуальная заявка (`accepted`) позволяет мастеру прямо в карточке заявки открыть модальную форму создания куклы (`ProductForm`) со всеми возможностями (загрузка фото, сжатие, чипы материалов, генерация истории AI). Созданная кукла связывается с `custom_requests.response_product_id` и `products.custom_request_id`, помечается флагом `is_custom_order = true` и скрывается из публичной витрины/каталога/sitemap. На карточке заявки генерируется персональный блок ответа для клиента с предзаполненным сообщением, прямой ссылкой на куклу для проверки и оплаты, и кнопками 1-клика в Telegram, Viber и буфер обмена. |
| Полная автономность системы и динамические реквизиты (Turnkey System) | Все реквизиты юридического лица / ИП (УНП, ФИО, номер Торгового реестра, юрадрес, телефон, почта, стоимость и условия пересылки почтой) динамически подтягиваются из базы `site_settings`. Компоненты подвала, юридические страницы (`/oferta`, `/politika-konfidencialnosti`, `/dostavka-i-oplata`) и микроразметка Schema.org мгновенно обновляются при изменении в админке без изменения исходного кода. Владельцу при запуске остаётся лишь указать реальный УНП, привязать домен `.by` и настроить боевой хостинг. |
| Резервное копирование и безопасность (Шаги 7.5–7.8) | Созданы скрипты резервного копирования `deploy/scripts/backup.sh` (pg_dump, gzip, AES-256 шифрование, ротация 14 дней) и восстановления `restore.sh`. Написаны тесты безопасности `tests/security.spec.ts` (защита от IDOR через UUIDv4, timing-safe проверка подписи вебхуков, honeypot ловушка, аудит отсутствия утечек секретов в клиентский бандл). Подготовлен скрипт инициализации сервера `bootstrap-server.sh` (Ubuntu LTS, SWAP 2GB, Docker CE, UFW, fail2ban), настроены пайплайны GitHub Actions CI/CD (`.github/workflows/{ci,deploy}.yml`), регламент `docs/deploy.md` и чек-лист `docs/security-checklist.md`. |

### ❓ Открыто
| # | Вопрос | Нужно к |
|---|---|---|
| 1 | Финальный ввод реального УНП и номера Торгового реестра мастера в `/admin/nastrojki` | Момент боевого запуска на VPS |
| 2 | Ввод боевых ключей bePaid (shop_id / secret_key) после подписания договора с банком (пока работает встроенный Sandbox) | Момент боевого запуска на VPS |

### Заявка «Хочу похожую» с фото-референсом
| Решение | Статус |
|---|---|
| Форма `/na-zakaz` принимает до 3 фото (JPEG/PNG/WebP, до 5 МБ). Файлы загружает публичный `POST /api/request-photo` (проверка по сигнатуре файла, rate-limit 10/10 мин), сохраняются в `public/uploads/requests/`, ссылки пишутся в `custom_requests.reference_photo_urls` (миграция `drizzle/0004_request_photos.sql`) и показываются мастеру в админке. `/zakaz-po-foto` перенаправляет на `/na-zakaz`. | Принято |

### Правило «use server» и отмена брони
| Решение | Статус |
|---|---|
| Файлы с `"use server"` экспортируют ТОЛЬКО async-функции (иначе Next падает на каждом вызове экшена — это ломало «Бронь» и «Отменить бронь»). Zod-схемы и константы вынесены в `src/lib/schemas/*`. Отмена брони идемпотентна: если мастер уже снял бронь в админке или она истекла (кукла `available`), покупателю возвращается успех; кеш витрины сбрасывается тегами, счётчик корзины обновляется событием `dollshop:cart-changed`. | Принято |

### Мобильный свайп в галерее фотографий куклы
| Решение | Статус |
|---|---|
| В карточке куклы `ProductGallery` добавлена поддержка сенсорных жестов свайпа влево/вправо (`onTouchStart`, `onTouchMove`, `onTouchEnd`) для быстрого листания фото на смартфонах и планшетах без обязательного тапа по миниатюрам. Стрелки навигации на мобильных экранах теперь видимы по умолчанию (`opacity-80`), а клик по фото для вызова Lightbox блокируется при выполнении свайпа. | Принято |

### Сценарий интерактивной демонстрации продукта (Demo & Presentation Flow)
| Решение | Статус |
|---|---|
| Сформирован полный путеводитель и регламент презентации продукта (`docs/demo-guide.md`) на 6-8 минут: демонстрация мобильного входа по QR-коду, витрины с авторской терминологией, защиты от состояния гонки (атомарная PostgreSQL-бронь на 15 мин), чекаута по законам РБ (Белпочта, ЕРИП, 3-D Secure), индивидуальных заявок с фото с камеры телефона, мобильной админки мастера с генератором описаний кукол через Google Gemini и Live Sync синхронизацией. В `DemoCenterClient` исправлены ссылки на разделы админки (`/admin/zakazy`, `/admin/kukly/new`). В базу добавлены реалистичные демонстрационные заявки клиентов. | Принято |

### SEO-инфраструктура, OpenGraph и боевой Telegram
| Решение | Статус |
|---|---|
| Реализована генерация `robots.txt` с правилами для Яндекса (`Clean-param`) и защитой служебных URL, динамический `sitemap.xml` со всеми куклами и фото, OpenGraph карточки 1200x630 с фирменными шрифтами (Cormorant Garamond, Manrope) и ценой в BYN, микроразметка Schema.org (`Product`, `BreadcrumbList`, `LocalBusiness`). Подключен Telegram-бот мастера (`@dollshopby_bot`), успешно протестирована отправка приветствия, заказов с inline-кнопками управления и заявок на повтор. | Принято |

### Telegram: фокус на уведомлениях и перевод в панель сайта
| Решение | Статус |
|---|---|
| Telegram используется исключительно для мгновенных удобных уведомлений мастера и перевода на сайт. Из сообщений удалены callback-кнопки подтверждения/отмены, которые требовали внешнего вебхука и вели к сбоям кликов. Каждое уведомление (новый заказ, оплата картой/ЕРИП, заявка «Хочу похожую») снабжено четкой URL-кнопкой прямого перехода в веб-панель управления (`/admin/zakazy`, `/admin/zayavki`). Все операции со статусами заказов, трек-номерами Белпочты и историей выполняются централизованно в PWA-админке мастера. | Принято |

### Отслеживание заказов без паролей (Zero-Friction Order Tracking & Phone Lookup)
| Решение | Статус |
|---|---|
| Покупателям предоставлена 100% стабильная система отслеживания заказов без необходимости регистрации и паролей (Вариант 1). Реализовано двухуровневое хранилище: автосохранение оформленных заказов в `localStorage` (`dollshop_recent_orders`) и cookie `dollshop_order_tokens` на текущем устройстве, плюс серверный поиск по номеру телефона Беларуси (`findOrdersByPhoneAction` / `getOrdersByCustomerPhone`) в PostgreSQL при смене устройства или очистке кэша браузера. Добавлен пользовательский хаб `/moi-zakazy`, интеграция в корзину `/cart`, прямые ссылки в шапке сайта и в мобильном меню, карточки заказов с живым статусом (`Оплачен`, `В пути`), автоматическая синхронизация на `/zakaz/[token]` и кликабельный трекинг посылок Белпочты (`belpost.by`). Вариант с привязкой через Telegram признан избыточным и отклонен для упрощения клиентского пути. | Принято |

### Почтовая доставка: статусы, оговорка о Белпочте, SMS и экранный бланк
| Решение | Статус |
|---|---|
| Реализована детальная схема почтовой доставки: 1) В «Моих заказах» и чеке заказа разделены статусы: «Всё упаковываем, всё чётко!» (до отправки) и «Посылка передана на почту · В пути» (при внесении трека); 2) Внедрена обязательная оговорка на витрине и в чекауте о том, что мастер отвечает за упаковку и передачу в ОПС (1–2 рабочих дня), а скорость транспортировки регулируется РУП «Белпочта» (2–4 рабочих дня); 3) Закреплено информирование покупателя об обязательном бесплатном SMS от Белпочты при поступлении в ОПС и необходимости паспорта; 4) В `/admin/zakazy` добавлена модальная форма «Бланк для оператора (крупно)» шрифтом 18px для удобного предъявления на почте с телефона. | Принято |





