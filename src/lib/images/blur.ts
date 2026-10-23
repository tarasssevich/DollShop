/**
 * Генератор micro-blur плейсхолдера (16px base64 dataUrl).
 * Используется Next.js Image для мгновенного плавного показа размытого фона до загрузки оригинала.
 */

/**
 * Статичный нейтральный плейсхолдер для серверного рендеринга или сред без Canvas (SVG Data URL)
 */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='100%25' height='100%25' fill='%23EDE3D8'/%3E%3C/svg%3E";

/**
 * Создает micro-blur dataUrl изображения (ширина 16px с сохранением пропорций).
 * В браузере использует Canvas, в серверном окружении или при ошибке возвращает нейтральный плейсхолдер.
 */
export async function generateBlurDataUrl(
  source: File | Blob | HTMLImageElement | ImageBitmap
): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return DEFAULT_BLUR_DATA_URL;
  }

  try {
    let imgBitmap: ImageBitmap | HTMLImageElement;

    if (source instanceof Blob) {
      if (typeof createImageBitmap === "function") {
        try {
          imgBitmap = await createImageBitmap(source);
        } catch {
          const url = URL.createObjectURL(source);
          const img = new Image();
          img.src = url;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
          });
          URL.revokeObjectURL(url);
          imgBitmap = img;
        }
      } else {
        const url = URL.createObjectURL(source);
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
        });
        URL.revokeObjectURL(url);
        imgBitmap = img;
      }
    } else {
      imgBitmap = source;
    }

    const origWidth =
      "width" in imgBitmap ? imgBitmap.width : (imgBitmap as HTMLImageElement).naturalWidth;
    const origHeight =
      "height" in imgBitmap ? imgBitmap.height : (imgBitmap as HTMLImageElement).naturalHeight;

    const targetWidth = 16;
    const targetHeight = Math.max(1, Math.round((origHeight / origWidth) * targetWidth));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return DEFAULT_BLUR_DATA_URL;
    }

    // Мягкое сглаживание для создания blur-эффекта
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);

    // Пытаемся сохранить в WebP, при отсутствии поддержки — в JPEG
    try {
      return canvas.toDataURL("image/webp", 0.5);
    } catch {
      return canvas.toDataURL("image/jpeg", 0.5);
    }
  } catch (err) {
    console.warn("Не удалось сгенерировать blur-плейсхолдер:", err);
    return DEFAULT_BLUR_DATA_URL;
  }
}
