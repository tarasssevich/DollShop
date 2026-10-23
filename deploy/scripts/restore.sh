#!/usr/bin/env bash
# ==============================================================================
# DollShop - Восстановление базы данных PostgreSQL из бэкапа (Step 7.5)
# Принимает путь к .sql.gz или .sql.gz.enc, расшифровывает и восстанавливает данные.
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Использование: $0 <путь_к_файлу_бэкапа> [--yes]"
  echo "Пример: $0 /opt/dollshop/backups/dollshop_20261024_010000.sql.gz.enc --yes"
  exit 1
fi

BACKUP_FILE="$1"
ASSUME_YES="${2:-}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Ошибка: файл $BACKUP_FILE не существует!" >&2
  exit 1
fi

DB_HOST="${PGHOST:-${POSTGRES_HOST:-localhost}}"
DB_PORT="${PGPORT:-${POSTGRES_PORT:-5432}}"
DB_USER="${PGUSER:-${POSTGRES_USER:-app_user}}"
DB_NAME="${PGDATABASE:-${POSTGRES_DB:-dollshop}}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"

echo "⚠️ ВНИМАНИЕ: Восстановление перезапишет данные в базе '${DB_NAME}' на ${DB_HOST}:${DB_PORT}!"
if [ "$ASSUME_YES" != "--yes" ] && [ "$ASSUME_YES" != "-y" ]; then
  read -rp "Вы действительно хотите продолжить? (введите 'yes'): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Отменено пользователем."
    exit 0
  fi
fi

TEMP_SQL_GZ="/tmp/restore_temp_$$.sql.gz"
trap 'rm -f "$TEMP_SQL_GZ"' EXIT

# Расшифровка, если файл зашифрован
if [[ "$BACKUP_FILE" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    read -rsp "Введите пароль шифрования BACKUP_ENCRYPTION_KEY: " BACKUP_ENCRYPTION_KEY
    echo
  fi
  echo "[$(date -Iseconds)] 🔓 Расшифровка архива ${BACKUP_FILE}..."
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
    -in "$BACKUP_FILE" \
    -out "$TEMP_SQL_GZ" \
    -pass pass:"$BACKUP_ENCRYPTION_KEY"
else
  cp "$BACKUP_FILE" "$TEMP_SQL_GZ"
fi

TARGET_DB_URL="${DATABASE_OWNER_URL:-${DATABASE_URL:-}}"

echo "[$(date -Iseconds)] 📥 Восстановление базы данных..."
if [ -n "$TARGET_DB_URL" ] && command -v psql >/dev/null 2>&1; then
  gunzip -c "$TEMP_SQL_GZ" | psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1
elif [ -n "$DB_HOST" ] && command -v psql >/dev/null 2>&1; then
  gunzip -c "$TEMP_SQL_GZ" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q 'dollshop-postgres'; then
  gunzip -c "$TEMP_SQL_GZ" | docker exec -i dollshop-postgres psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
else
  echo "❌ Ошибка: psql не найден и контейнер dollshop-postgres не запущен!" >&2
  exit 1
fi

echo "[$(date -Iseconds)] ✅ База данных '${DB_NAME}' успешно восстановлена из ${BACKUP_FILE}!"
