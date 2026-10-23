import { describe, it, expect } from "vitest";
import {
  calculateDimensions,
  IMAGE_VARIANTS,
} from "../compress";

describe("Image Compression Utilities (Step 4.5)", () => {
  describe("calculateDimensions", () => {
    it("правильно масштабирует квадратное изображение под лимит", () => {
      const res = calculateDimensions(4000, 4000, 2000);
      expect(res).toEqual({ width: 2000, height: 2000 });
    });

    it("правильно масштабирует горизонтальное фото с сохранением соотношения сторон", () => {
      // 6000x4000 -> 2000x1333
      const res2000 = calculateDimensions(6000, 4000, 2000);
      expect(res2000.width).toBe(2000);
      expect(res2000.height).toBe(1333);

      const res1280 = calculateDimensions(6000, 4000, 1280);
      expect(res1280.width).toBe(1280);
      expect(res1280.height).toBe(853);

      const res640 = calculateDimensions(6000, 4000, 640);
      expect(res640.width).toBe(640);
      expect(res640.height).toBe(427);
    });

    it("правильно масштабирует вертикальное (портретное) фото куклы", () => {
      // 3000x4000 -> 1500x2000
      const res2000 = calculateDimensions(3000, 4000, 2000);
      expect(res2000.width).toBe(1500);
      expect(res2000.height).toBe(2000);

      const res1280 = calculateDimensions(3000, 4000, 1280);
      expect(res1280.width).toBe(960);
      expect(res1280.height).toBe(1280);

      const res640 = calculateDimensions(3000, 4000, 640);
      expect(res640.width).toBe(480);
      expect(res640.height).toBe(640);
    });

    it("не растягивает изображение, если исходные размеры меньше целевого лимита", () => {
      const res = calculateDimensions(500, 400, 2000);
      expect(res).toEqual({ width: 500, height: 400 });
    });

    it("безопасно обрабатывает нулевые или отрицательные размеры", () => {
      const res = calculateDimensions(0, 0, 1000);
      expect(res.width).toBe(1000);
      expect(res.height).toBe(1000);
    });
  });

  describe("IMAGE_VARIANTS configuration", () => {
    it("содержит три строгих разрешения согласно спецификации Zero-IT медиа-пайплайна", () => {
      expect(IMAGE_VARIANTS).toHaveLength(3);

      const [v2000, v1280, v640] = IMAGE_VARIANTS;
      expect(v2000).toBeDefined();
      expect(v1280).toBeDefined();
      expect(v640).toBeDefined();

      if (v2000 && v1280 && v640) {
        expect(v2000.size).toBe("2000");
        expect(v2000.maxDimension).toBe(2000);
        expect(v2000.targetMaxBytes).toBe(350 * 1024);

        expect(v1280.size).toBe("1280");
        expect(v1280.maxDimension).toBe(1280);
        expect(v1280.targetMaxBytes).toBe(150 * 1024);

        expect(v640.size).toBe("640");
        expect(v640.maxDimension).toBe(640);
        expect(v640.targetMaxBytes).toBe(60 * 1024);
      }
    });
  });
});
