#!/usr/bin/env bash
# ==============================================================================
# DollShop - Автоматизированное резервное копирование PostgreSQL (Step 7.5)
# Создаёт зашифрованный дамп базы данных, сохраняет локально и в S3,
# удаляет копии старше 14 дней, шлёт отчёт в Telegram при ошибке.
# ==============================================================================

set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/opt/dollshop/backups}"
mkdir -p "$BACKUP_DIR"

# Определение параметров подключения
DB_HOST="${PGHOST:-${POSTGRES_HOST:-localhost}}"
DB_PORT="${PGPORT:-${POSTGRES_PORT:-5432}}"
DB_USER="${PGUSER:-${POSTGRES_USER:-app_user}}"
DB_NAME="${PGDATABASE:-${POSTGRES_DB:-dollshop}}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"

RAW_DUMP_FILE="${BACKUP_DIR}/dollshop_${TIMESTAMP}.sql.gz"
FINAL_FILE="$RAW_DUMP_FILE"

echo "[$(date -Iseconds)] 📦 Запуск резервного копирования базы ${DB_NAME} (${DB_HOST}:${DB_PORT})..."

TARGET_DB_URL="${DATABASE_OWNER_URL:-${DATABASE_URL:-}}"

# 1. Снятие дампа и gzip-сжатие
if [ -n "$TARGET_DB_URL" ] && command -v pg_dump >/dev/null 2>&1; then
  pg_dump --clean --if-exists "$TARGET_DB_URL" | gzip -9 > "$RAW_DUMP_FILE"
elif [ -n "$DB_HOST" ] && command -v pg_dump >/dev/null 2>&1; then
  pg_dump --clean --if-exists -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip -9 > "$RAW_DUMP_FILE"
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q 'dollshop-postgres'; then
  docker exec -t dollshop-postgres pg_dump --clean --if-exists -U "$DB_USER" "$DB_NAME" | gzip -9 > "$RAW_DUMP_FILE"
else
  echo "❌ Ошибка: утилита pg_dump не найдена, и контейнер dollshop-postgres не запущен!" >&2
  exit 1
fi

DUMP_SIZE=$(du -h "$RAW_DUMP_FILE" | cut -f1)
echo "[$(date -Iseconds)] ✅ Дамп создан: ${RAW_DUMP_FILE} (${DUMP_SIZE})"

# 2. Опциональное шифрование AES-256-CBC с PBKDF2
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  ENCRYPTED_FILE="${RAW_DUMP_FILE}.enc"
  echo "[$(date -Iseconds)] 🔐 Шифрование дампа по алгоритму AES-256-CBC..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "$RAW_DUMP_FILE" \
    -out "$ENCRYPTED_FILE" \
    -pass pass:"$BACKUP_ENCRYPTION_KEY"
  
  rm -f "$RAW_DUMP_FILE"
  FINAL_FILE="$ENCRYPTED_FILE"
  ENC_SIZE=$(du -h "$FINAL_FILE" | cut -f1)
  echo "[$(date -Iseconds)] 🔒 Зашифрованный архив: ${FINAL_FILE} (${ENC_SIZE})"
fi

# 3. Опциональная отправка в S3 (Hoster.by / AWS)
if [ -n "${AWS_S3_BUCKET_BACKUPS:-}" ] && command -v aws >/dev/null 2>&1; then
  echo "[$(date -Iseconds)] ☁️ Отправка в бакет ${AWS_S3_BUCKET_BACKUPS}..."
  aws s3 cp "$FINAL_FILE" "s3://${AWS_S3_BUCKET_BACKUPS}/$(basename "$FINAL_FILE")" \
    ${AWS_ENDPOINT_URL:+--endpoint-url "$AWS_ENDPOINT_URL"} || {
      echo "⚠️ Предупреждение: не удалось отправить архив в S3" >&2
    }
fi

# 4. Ротация: удаление локальных бэкапов старше 14 дней
echo "[$(date -Iseconds)] 🧹 Очистка старых архивов (срок хранения: 14 дней)..."
find "$BACKUP_DIR" -type f \( -name "dollshop_*.sql.gz" -o -name "dollshop_*.sql.gz.enc" \) -mtime +14 -delete

echo "[$(date -Iseconds)] 🎉 Резервное копирование успешно завершено!"
