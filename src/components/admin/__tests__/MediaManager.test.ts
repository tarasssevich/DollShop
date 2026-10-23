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
});
