#!/bin/sh
set -e

echo "⏰ Запуск cron-демона DollShop..."
echo "🕒 Текущее системное время: $(date)"

# Значения по умолчанию
WEB_URL=${WEB_URL:-"http://web:3000"}
CRON_SECRET=${CRON_SECRET:-"dev_cron_secret_dollshop_local"}

echo "🔗 Целевой веб-сервер: $WEB_URL"

# Подстановка переменных окружения в шаблон crontab
sed -e "s|__WEB_URL__|$WEB_URL|g" \
    -e "s|__CRON_SECRET__|$CRON_SECRET|g" \
    /app/crontab.template > /etc/crontabs/root

chmod 0600 /etc/crontabs/root
mkdir -p /var/log
touch /var/log/cron.log

echo "✅ Crontab успешно сконфигурирован:"
cat /etc/crontabs/root

echo "🚀 Запуск фонового планировщика crond..."
exec crond -f -l 2
