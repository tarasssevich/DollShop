# Развертывание DollShop (Docker Compose Production Stack)

Инструкция по локальному и серверному запуску полного стека бутика DollShop в соответствии с Указом № 60 (РБ).

---

## Архитектура контейнеров
* **`nginx`** (порт `80` и `443`): Обратный прокси-сервер с автоматическим микрокэшированием публичных страниц витрины на 5 секунд (`proxy_cache microcache`), сжатием Gzip и защитными HTTP-заголовками (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
* **`web`** (порт `3000`, внутренний): Standalone-сборка Next.js 16 на Node.js 22 Alpine, запускается от непривилегированного пользователя `nextjs` (UID 1001).
* **`db`** (порт `5432`, внутренний): PostgreSQL 18 Alpine с постоянным томом `dollshop_pgdata`.
* **`cron`**: Фоновый планировщик на базе Alpine Linux (Europe/Minsk), каждую минуту опрашивает `/api/cron/expire-reservations` для освобождения зависших броней и управляет ежедневными резервными копиями базы.

---

## Запуск полного прод-стека

```bash
# 1. Перейдите в каталог проекта
cd /home/ofi/DollShop

# 2. Проверка валидности конфигурации
docker compose -f deploy/docker-compose.prod.yml config

# 3. Сборка и запуск в фоновом режиме
docker compose -f deploy/docker-compose.prod.yml up -d --build

# 4. Просмотр логов
docker compose -f deploy/docker-compose.prod.yml logs -f

# 5. Проверка статуса здоровья сервисов
curl -s http://localhost/api/health
```

---

## Остановка стека

```bash
docker compose -f deploy/docker-compose.prod.yml down
```
