# Пошаговая инструкция по развертыванию DollShop на VPS в Беларуси (Step 7.6)

Настоящая инструкция содержит полный регламент развертывания арт-бутика **DollShop** на виртуальном сервере в Республике Беларусь в строгом соответствии с **Указом Президента РБ № 60**.

---

## 1. Выбор хостинга и домена

### 1.1. Рекомендуемый провайдер в РБ
В соответствии с законодательством Республики Беларусь, сервер интернет-магазина и база данных должны физически располагаться в национальном сегменте сети Интернет:
* **hoster.by** (ООО «Надежные программы») — тариф Cloud VPS / KVM VPS;
* либо **hb.by** (ООО «Хэндбай»).

### 1.2. Рекомендуемая конфигурация VPS
* **ОС:** Ubuntu 22.04 LTS или 24.04 LTS (64-bit);
* **Процессор:** 2 vCPU;
* **Оперативная память:** 2–4 ГБ RAM (в скрипте `bootstrap-server.sh` автоматически настраивается 2 ГБ SWAP);
* **Диск:** от 30 ГБ NVMe SSD;
* **IP-адрес:** 1 выделенный статический IPv4.

### 1.3. Регистрация домена
* Зарегистрируйте домен в национальной зоне **`.by`** (например, `dollshop.by` или `alyona-dolls.by`).
* В панели регистратора направьте DNS А-запись на статический IP-адрес вашего VPS:
  * `@` `A` `->` `IP_ВАШЕГО_СЕРВЕРА`
  * `www` `CNAME` `->` `@`

---

## 2. Первоначальная настройка сервера (Bootstrap)

После создания сервера подключитесь к нему по SSH:
```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

Загрузите и запустите автоматический скрипт подготовки:
```bash
# Клонирование репозитория или загрузка скрипта
git clone https://github.com/ВАШ_АККАУНТ/DollShop.git /opt/dollshop
cd /opt/dollshop

# Запуск подготовки (установит Docker CE, SWAP, файрвол, пользователя deploy)
sudo ./deploy/scripts/bootstrap-server.sh
```

---

## 3. Настройка переменных окружения (`.env.production`)

В каталоге `/opt/dollshop` создайте файл `.env.production`:
```bash
cp .env.example .env.production
nano .env.production
```

Заполните ключевые боевые параметры:
```env
# Базовый URL магазина
NEXT_PUBLIC_SITE_URL="https://dollshop.by"
BETTER_AUTH_URL="https://dollshop.by"

# Сгенерируйте случайный ключ (openssl rand -hex 32)
BETTER_AUTH_SECRET="вставьте_сгенерированный_ключ_32_байта"

# Секрет для cron-задач (освобождение броней)
CRON_SECRET="вставьте_надежный_секрет_для_cron"

# База данных PostgreSQL (пароль придумайте сложный)
POSTGRES_USER="dollshop_app"
POSTGRES_PASSWORD="боевой_сложный_пароль_бд"
POSTGRES_DB="dollshop"
DATABASE_URL="postgres://dollshop_app:боевой_сложный_пароль_бд@postgres:5432/dollshop"

# Резервное копирование: ключ шифрования AES-256
BACKUP_ENCRYPTION_KEY="секретный_ключ_для_бэкапов_aes256"

# Telegram-бот мастера
TELEGRAM_BOT_TOKEN="токен_вашего_бота_из_BotFather"
TELEGRAM_CHAT_ID="ваш_telegram_id"

# Google Gemini (для генерации историй кукол)
GOOGLE_GEMINI_API_KEY="ваш_api_ключ_gemini"

# Платёжный шлюз bePaid (после заключения договора с банком)
# На старте можно оставить sandbox режим:
BEPAID_SANDBOX="false"
BEPAID_SHOP_ID="боевой_id_магазина"
BEPAID_SECRET_KEY="боевой_секретный_ключ"
```

---

## 4. Получение бесплатного SSL-сертификата (Let's Encrypt)

Для получения сертификата используйте Certbot:
```bash
# Установка Certbot
apt-get install -y certbot

# Получение сертификата (замените dollshop.by на ваш домен)
certbot certonly --standalone -d dollshop.by -d www.dollshop.by --agree-tos -m master@dollshop.by --non-interactive

# Копирование сертификатов в каталог Nginx
cp /etc/letsencrypt/live/dollshop.by/fullchain.pem /opt/dollshop/deploy/nginx/ssl/
cp /etc/letsencrypt/live/dollshop.by/privkey.pem /opt/dollshop/deploy/nginx/ssl/
```

В файле `deploy/nginx/conf.d/default.conf` укажите ваш домен вместо `localhost`:
```nginx
server_name dollshop.by www.dollshop.by;
```

---

## 5. Запуск контейнеров

Запустите производственную сборку через Docker Compose:
```bash
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d --build
```

Проверьте статус запущенных контейнеров:
```bash
docker compose -f deploy/docker-compose.prod.yml ps
```
Должны работать 4 контейнера:
1. `dollshop-postgres` — СУБД PostgreSQL 18;
2. `dollshop-app` — Next.js 16 standalone (non-root UID 1001);
3. `dollshop-nginx` — обратный прокси с Gzip, микрокэшем и CSP;
4. `dollshop-cron` — фоновые задачи (очистка броней раз в минуту).

---

## 6. Применение миграций и создание администратора

Выполните миграции структуры базы данных и наполнение каталога:
```bash
# Применение миграций Drizzle
docker compose -f deploy/docker-compose.prod.yml exec app npm run db:migrate

# Заполнение каталога начальными авторскими работами
docker compose -f deploy/docker-compose.prod.yml exec app npm run db:seed

# Создание учетной записи мастера
docker compose -f deploy/docker-compose.prod.yml exec app npm run auth:create-admin master@dollshop.by "ВашПароль" "Алёна"
```

---

## 7. Настройка ежедневного резервного копирования

Добавьте задание в системный `crontab` сервера (`sudo crontab -e`):
```cron
# Ежедневно в 03:00 ночи: создание зашифрованного дампа AES-256
0 3 * * * /opt/dollshop/deploy/scripts/backup.sh >> /var/log/dollshop-backup.log 2>&1

# Автоматическое продление SSL-сертификата Let's Encrypt раз в месяц
0 4 1 * * certbot renew --quiet && docker compose -f /opt/dollshop/deploy/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 8. Проверка работоспособности (Smoke Test)

1. Откройте `https://dollshop.by/api/health` — должен вернуться JSON `{"status":"ok"}`.
2. Откройте витрину `https://dollshop.by` — убедитесь, что отображаются авторские куклы с фотографиями.
3. Добавьте куклу в корзину — запустится таймер бронирования на 15 минут.
4. Откройте панель мастера `https://dollshop.by/admin` — авторизуйтесь под созданным логином.
5. Зайдите в `/admin/nastrojki` — укажите ваш реальный УНП, ФИО и номер Торгового реестра.
6. Загрузите фотографию новой куклы со смартфона — фото мгновенно появится в сетке галереи.
