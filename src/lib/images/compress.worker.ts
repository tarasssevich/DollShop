/**
 * Web Worker для фонового сжатия изображений кукол без блокировки главного UI-потока.
 */

import {
  calculateDimensions,
  compressCanvasToWebpBlob,
  IMAGE_VARIANTS,
  type CompressedVariant,
} from "./compress";

export interface WorkerProcessRequest {
  id: string;
  file: File | Blob;
}

export interface WorkerProcessSuccess {
  id: string;
  success: true;
  originalWidth: number;
  originalHeight: number;
  variants: {
    "2000": CompressedVariant;
    "1280": CompressedVariant;
    "640": CompressedVariant;
  };
}

export interface WorkerProcessError {
  id: string;
  success: false;
  error: string;
}

export type WorkerProcessResponse = WorkerProcessSuccess | WorkerProcessError;

self.onmessage = async (event: MessageEvent<WorkerProcessRequest>) => {
  const { id, file } = event.data;

  try {
    const imgBitmap = await createImageBitmap(file);
    const origWidth = imgBitmap.width;
    const origHeight = imgBitmap.height;

    const variantsMap: Partial<Record<"2000" | "1280" | "640", CompressedVariant>> = {};

    for (const cfg of IMAGE_VARIANTS) {
      const { width, height } = calculateDimensions(
        origWidth,
        origHeight,
        cfg.maxDimension
      );

      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Не удалось получить OffscreenCanvas 2D контекст");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgBitmap, 0, 0, width, height);

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

    imgBitmap.close();

    const response: WorkerProcessSuccess = {
      id,
      success: true,
      originalWidth: origWidth,
      originalHeight: origHeight,
      variants: {
        "2000": variantsMap["2000"]!,
        "1280": variantsMap["1280"]!,
        "640": variantsMap["640"]!,
      },
    };

    self.postMessage(response);
  } catch (err) {
    const response: WorkerProcessError = {
      id,
      success: false,
      error:
        err instanceof Error ? err.message : "Неизвестная ошибка в Web Worker",
    };
    self.postMessage(response);
  }
};
