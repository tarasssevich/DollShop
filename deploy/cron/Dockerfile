FROM alpine:3.21

# Установка необходимых утилит: curl для вызова API, postgresql-client для pg_dump, bash и часовой пояс Беларуси
RUN apk add --no-cache \
    curl \
    postgresql17-client \
    bash \
    tzdata \
    dcron \
    ca-certificates

# Установка часового пояса Минска (UTC+3)
ENV TZ=Europe/Minsk
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Копируем скрипты и конфигурацию cron
COPY crontab /app/crontab.template
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
