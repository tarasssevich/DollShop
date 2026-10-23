import { generateBlurDataUrl } from "./blur";

export interface ImageVariantConfig {
  size: "2000" | "1280" | "640";
  maxDimension: number;
  quality: number;
  targetMaxBytes: number;
}

export const IMAGE_VARIANTS: readonly ImageVariantConfig[] = [
  {
    size: "2000",
    maxDimension: 2000,
    quality: 0.82,
    targetMaxBytes: 350 * 1024, // ≤ 350 КБ
  },
  {
    size: "1280",
    maxDimension: 1280,
    quality: 0.80,
    targetMaxBytes: 150 * 1024, // ≤ 150 КБ
  },
  {
    size: "640",
    maxDimension: 640,
    quality: 0.78,
    targetMaxBytes: 60 * 1024, // ≤ 60 КБ
  },
] as const;

/**
 * Рассчитывает новые размеры с сохранением пропорций, чтобы ни ширина, ни высота не превышали maxDimension.
 */
export function calculateDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: Math.max(1, maxDimension), height: Math.max(1, maxDimension) };
  }

  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }

  const ratio = Math.min(maxDimension / origWidth, maxDimension / origHeight);
  return {
    width: Math.max(1, Math.round(origWidth * ratio)),
    height: Math.max(1, Math.round(origHeight * ratio)),
  };
}

export interface CompressedVariant {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export interface DollImageProcessingResult {
  originalWidth: number;
  originalHeight: number;
  blurDataUrl: string;
  variants: {
    "2000": CompressedVariant;
    "1280": CompressedVariant;
    "640": CompressedVariant;
  };
}

/**
 * Сжимает изображение в формат WebP заданного максимального размера с адаптивным контролем качества.
 */
export async function compressCanvasToWebpBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
  targetMaxBytes?: number
): Promise<Blob> {
  let currentQuality = quality;

  // OffscreenCanvas путь
  if ("convertToBlob" in canvas && typeof canvas.convertToBlob === "function") {
    let blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: currentQuality,
    });

    if (targetMaxBytes && blob.size > targetMaxBytes && currentQuality > 0.5) {
      currentQuality = Math.max(0.5, currentQuality - 0.1);
      blob = await canvas.convertToBlob({
        type: "image/webp",
        quality: currentQuality,
      });
    }

    return blob;
  }

  // Обычный HTMLCanvasElement путь
  const htmlCanvas = canvas as HTMLCanvasElement;
  const toBlobPromise = (q: number) =>
    new Promise<Blob>((resolve, reject) => {
      htmlCanvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Не удалось экспортировать canvas в blob"));
        },
        "image/webp",
        q
      );
    });

  let blob = await toBlobPromise(currentQuality);
  if (targetMaxBytes && blob.size > targetMaxBytes && currentQuality > 0.5) {
    currentQuality = Math.max(0.5, currentQuality - 0.1);
    blob = await toBlobPromise(currentQuality);
  }

  return blob;
}

/**
 * Клиентская функция полного цикла подготовки фотографии:
 * сжатие в 3 WebP разрешения (2000, 1280, 640px) + генерация micro-blur 16px.
 */
export async function processDollImage(
  file: File
): Promise<DollImageProcessingResult> {
  // Декодируем изображение
  let imgBitmap!: ImageBitmap | HTMLImageElement;
  let useFallback = typeof createImageBitmap !== "function";

  if (!useFallback) {
    try {
      // Поддержка ориентации EXIF для мобильных устройств
      imgBitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        imgBitmap = await createImageBitmap(file);
      } catch {
        useFallback = true;
      }
    }
  }

  if (useFallback) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("Не удалось загрузить изображение для обработки"));
    });
    URL.revokeObjectURL(url);
    imgBitmap = img;
  }

  const origWidth =
    "width" in imgBitmap ? imgBitmap.width : (imgBitmap as HTMLImageElement).naturalWidth;
  const origHeight =
    "height" in imgBitmap ? imgBitmap.height : (imgBitmap as HTMLImageElement).naturalHeight;

  // Генерируем blur-плейсхолдер
  const blurDataUrl = await generateBlurDataUrl(imgBitmap);

  // Генерируем 3 варианта сжатия
  const variantsMap: Partial<Record<"2000" | "1280" | "640", CompressedVariant>> = {};

  for (const cfg of IMAGE_VARIANTS) {
    const { width, height } = calculateDimensions(
      origWidth,
      origHeight,
      cfg.maxDimension
    );

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext("2d");
    } else {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d");
    }

    if (!ctx) {
      throw new Error("Не удалось инициализировать 2D контекст канваса");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgBitmap as CanvasImageSource, 0, 0, width, height);

    const blob = await compressCanvasToWebpBlob(
      canvas,
      cfg.quality,
      cfg.targetMaxBytes
    );

    variantsMap[cfg.size] = {
      blob,
      width,
      height,
      size: blob.size,
    };
  }

  // Очищаем bitmap, если поддерживается
  if ("close" in imgBitmap && typeof imgBitmap.close === "function") {
    imgBitmap.close();
  }

  return {
    originalWidth: origWidth,
    originalHeight: origHeight,
    blurDataUrl,
    variants: {
      "2000": variantsMap["2000"]!,
      "1280": variantsMap["1280"]!,
      "640": variantsMap["640"]!,
    },
  };
}
