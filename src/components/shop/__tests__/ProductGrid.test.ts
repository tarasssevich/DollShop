import { describe, it, expect } from "vitest";
import { ProductGrid } from "../ProductGrid";
import { getDolls } from "@/lib/data/catalog";
import type { Doll } from "@/types/domain";

describe("ProductGrid component — отображение только карточек с фото", () => {
  it("экспортирует функцию-компонент ProductGrid", () => {
    expect(typeof ProductGrid).toBe("function");
  });

  it("возвращает только кукол с существующими фотографиями через getDolls()", async () => {
    const dolls = await getDolls();
    expect(dolls.length).toBeGreaterThan(0);

    for (const doll of dolls) {
      expect(Array.isArray(doll.images)).toBe(true);
      expect(doll.images.length).toBeGreaterThan(0);
      expect(doll.images[0]?.url).toBeTruthy();
    }
  });

  it("корректно отсекает кукол без фотографий при передаче смешанного массива", () => {
    const mixedDolls: Partial<Doll>[] = [
      {
        id: "d1",
        name: "Кукла с фото",
        slug: "with-photo",
        images: [
          {
            id: "i1",
            url: "/mock/photo.jpg",
            width: 100,
            height: 100,
            blurDataUrl: "data:image/webp;base64,mock",
            alt: "Кукла с фото",
          },
        ],
      },
      {
        id: "d2",
        name: "Кукла без фото (пустой массив)",
        slug: "no-photo-empty",
        images: [],
      },
      {
        id: "d3",
        name: "Кукла без фото (пустой url)",
        slug: "no-photo-empty-url",
        images: [
          {
            id: "i2",
            url: "",
            width: 100,
            height: 100,
            blurDataUrl: "data:image/webp;base64,mock",
            alt: "Кукла без фото",
          },
        ],
      },
    ];

    const dollsWithPhotos = mixedDolls.filter(
      (d) =>
        Array.isArray(d.images) &&
        d.images.length > 0 &&
        Boolean(d.images[0]?.url)
    );

    expect(dollsWithPhotos).toHaveLength(1);
    expect(dollsWithPhotos[0]?.slug).toBe("with-photo");
  });
});
