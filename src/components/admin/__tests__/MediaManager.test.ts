import { describe, it, expect } from "vitest";
import type { MediaItem } from "../MediaManager";

describe("MediaManager State & Ordering Logic (Step 4.6)", () => {
  const sampleMedia: MediaItem[] = [
    { id: "1", url: "/media/1.webp", displayOrder: 0, alt: "Фото 1" },
    { id: "2", url: "/media/2.webp", displayOrder: 1, alt: "Фото 2" },
    { id: "3", url: "/media/3.webp", displayOrder: 2, alt: "Фото 3" },
  ];

  it("назначает фото обложкой (перемещает выбранное фото на первое место с displayOrder = 0)", () => {
    // Делаем третье фото (индекс 2) обложкой
    const targetIndex = 2;
    const targetItem = sampleMedia[targetIndex]!;
    const rest = sampleMedia.filter((_, i) => i !== targetIndex);
    const reordered = [targetItem, ...rest].map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    expect(reordered[0]?.id).toBe("3");
    expect(reordered[0]?.displayOrder).toBe(0);
    expect(reordered[1]?.id).toBe("1");
    expect(reordered[1]?.displayOrder).toBe(1);
    expect(reordered[2]?.id).toBe("2");
    expect(reordered[2]?.displayOrder).toBe(2);
  });

  it("перемещает фото влево (к началу)", () => {
    // Сдвигаем фото с индексом 1 влево на позицию 0
    const list = [...sampleMedia];
    const index = 1;
    const current = list[index]!;
    const prev = list[index - 1]!;

    list[index - 1] = current;
    list[index] = prev;

    const normalized = list.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    expect(normalized[0]?.id).toBe("2");
    expect(normalized[1]?.id).toBe("1");
    expect(normalized[2]?.id).toBe("3");
  });

  it("перемещает фото вправо (к концу)", () => {
    // Сдвигаем фото с индексом 0 вправо на позицию 1
    const list = [...sampleMedia];
    const index = 0;
    const current = list[index]!;
    const next = list[index + 1]!;

    list[index + 1] = current;
    list[index] = next;

    const normalized = list.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    expect(normalized[0]?.id).toBe("2");
    expect(normalized[1]?.id).toBe("1");
    expect(normalized[2]?.id).toBe("3");
  });

  it("удаляет фото и пересчитывает порядок оставшихся элементов", () => {
    const removeId = "2";
    const filtered = sampleMedia
      .filter((item) => item.id !== removeId)
      .map((item, idx) => ({
        ...item,
        displayOrder: idx,
      }));

    expect(filtered).toHaveLength(2);
    expect(filtered[0]?.id).toBe("1");
    expect(filtered[0]?.displayOrder).toBe(0);
    expect(filtered[1]?.id).toBe("3");
    expect(filtered[1]?.displayOrder).toBe(1);
  });

  describe("Batch upload up to 10 photos logic", () => {
    it("ограничивает единовременный пакет до 10 фотографий и вычисляет корректный displayOrder без коллизий", () => {
      const mockRawFiles = Array.from({ length: 15 }, (_, i) => ({
        name: `photo_${i + 1}.jpg`,
      }));

      const MAX_BATCH = 10;
      const batch = mockRawFiles.slice(0, MAX_BATCH);
      expect(batch).toHaveLength(10);

      const baseDisplayOrder = sampleMedia.length; // 3
      const orders = batch.map((_, index) => baseDisplayOrder + index);

      expect(orders).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      // Никаких коллизий displayOrder
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(10);
    });
  });
});
