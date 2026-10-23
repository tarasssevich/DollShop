# Руководство по настройке S3-хранилища (hoster.by / AWS / MinIO)

Для хранения и раздачи фотографий кукол DollShop использует S3-совместимое объектное хранилище с прямой загрузкой из браузера через **Presigned URLs**.

Это освобождает бэкенд Next.js от тяжёлого трафика и нагрузки на процессор при обработке картинок — сжатие в WebP выполняется прямо в браузере мастера, а файлы загружаются напрямую в бакет.

---

## 1. Регистрация бакета в hoster.by (или AWS S3 / MinIO)

1. Создайте бакет с именем, например, `dollshop-media` (или `dollshop-media-prod`).
2. Доступ к объектам: бакет должен иметь **публичный доступ на чтение** (`Public Read`) для раздачи картинок покупателям витрины.
3. Доступ на запись разрешен только по подписанным ссылкам (**Presigned PUT URL**), генерируемым бэкендом админки.

---

## 2. Настройка CORS (Cross-Origin Resource Sharing)

Так как загрузка из браузера мастера происходит методом `PUT` прямо в S3, необходимо разрешить CORS-запросы с домена магазина.

### Конфигурация CORS (JSON):
```json
[
  {
    "AllowedOrigins": [
      "https://dollshop.by",
      "https://*.dollshop.by",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": [
      "PUT",
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 3. Переменные окружения (.env.local)

Для подключения к хранилищу добавьте в `.env.local` или переменные окружения сервера:

```env
# S3 hoster.by
S3_ENDPOINT="https://s3.hoster.by"
S3_REGION="auto"
S3_ACCESS_KEY_ID="ваш_access_key"
S3_SECRET_ACCESS_KEY="ваш_secret_key"
S3_BUCKET_MEDIA="dollshop-media"
S3_FORCE_PATH_STYLE="true"

# (Опционально) Публичный домен или CDN для раздачи картинок:
# S3_PUBLIC_URL="https://media.dollshop.by"
```

### Локальная разработка и тестирование (Fallback):
Если переменные `S3_ACCESS_KEY_ID` и `S3_SECRET_ACCESS_KEY` не заданы, система автоматически активирует `LocalStorageAdapter`:
- Файлы сохраняются в директорию `public/uploads/products/{productId}/{mediaId}/{size}.webp`.
- Браузер обращается к локальному эмулятору `/api/storage/local-upload`.
- Позволяет полностью тестировать пайплайн без подключения к интернету и сторонним облакам.

---

## 4. Структура хранения файлов

Все фотографии кукол организованы по строгой иерархии:
```
products/
  ├── {productId}/
  │     ├── {mediaId}/
  │     │     ├── 2000.webp   # High-res (для зума и лайтбокса, max-width: 2000px, quality 0.82)
  │     │     ├── 1280.webp   # Desktop галерея (max-width: 1280px, quality 0.80)
  │     │     └── 640.webp    # Мобильные карточки и превью (max-width: 640px, quality 0.78)
```

Каждый файл получает заголовок `Cache-Control: public, max-age=31536000, immutable`, гарантирующий максимальную скорость загрузки и бесконечное кэширование на стороне браузера и CDN.
