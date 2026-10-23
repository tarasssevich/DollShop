/**
 * Кастомный загрузчик изображений Next.js для DollShop.
 * Автоматически перенаправляет запрос на оптимальный предсжатый WebP-вариант (640, 1280 или 2000px)
 * в зависимости от требуемой ширины экрана клиента.
 */

export interface DollImageLoaderOptions {
  src: string;
  width: number;
  quality?: number;
}

export function dollImageLoader({ src, width }: DollImageLoaderOptions): string {
  // Проверяем, является ли изображение структурированным медиа-файлом DollShop:
  // products/{productId}/{mediaId}/{size}.webp
  const variantRegex = /\/(2000|1280|640)\.webp(\?.*)?$/;

  if (variantRegex.test(src)) {
    let targetSize = "2000";
    if (width <= 640) {
      targetSize = "640";
    } else if (width <= 1280) {
      targetSize = "1280";
    }

    return src.replace(variantRegex, `/${targetSize}.webp$2`);
  }

  // Для локальных файлов моков или других источников возвращаем URL без изменений
  return src;
}

export default dollImageLoader;
