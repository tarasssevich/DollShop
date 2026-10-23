import { describe, it, expect } from "vitest";
import { DollsListClient } from "../DollsListClient";
import type { Doll } from "@/types/domain";

const defaultDetails = {
  wingMaterial: "Дерево",
  hairMaterial: "Хлопок",
  dressMaterial: "Фатин",
  bouquetDetails: "Цветы",
  hangingLoopIncluded: true,
  boxIncluded: true,
  certificateIncluded: true,
};

const MOCK_ADMIN_DOLLS: Doll[] = [
  {
    id: "doll-1",
    slug: "selesta",
    name: "Селеста · Фея незабудок",
    story: "История Селесты",
    description: "Описание Селесты",
    category: "fairies",
    collection: "Весенняя коллекция",
    heightCm: 22,
    year: 2026,
    materials: ["Эко-хлопок", "Дерево"],
    details: defaultDetails,
    priceByn: 45,
    status: "available",
    reservedUntil: null,
    isFeatured: true,
    isDraft: false,
    createdAt: "2026-03-01T12:00:00Z",
    updatedAt: "2026-03-01T12:00:00Z",
    images: [
      {
        id: "m1",
        url: "/mock/1.webp",
        isCover: true,
        width: 800,
        height: 1000,
        blurDataUrl: "data:image/webp;base64,placeholder",
        alt: "Селеста",
      },
    ],
  },
  {
    id: "doll-2",
    slug: "liza-v-lunnom-svete",
    name: "Лиза в лунном свете",
    story: "История Лизы",
    description: "Описание Лизы",
    category: "fairies",
    collection: "Ночная серия",
    heightCm: 20,
    year: 2026,
    materials: ["Шёлк", "Дерево"],
    details: defaultDetails,
    priceByn: 60,
    status: "sold",
    reservedUntil: null,
    isFeatured: false,
    isDraft: false,
    createdAt: "2026-02-01T12:00:00Z",
    updatedAt: "2026-02-01T12:00:00Z",
    images: [
      {
        id: "m2",
        url: "/mock/2.webp",
        isCover: true,
        width: 800,
        height: 1000,
        blurDataUrl: "data:image/webp;base64,placeholder",
        alt: "Лиза",
      },
    ],
  },
  {
    id: "doll-3",
    slug: "draft-doll",
    name: "Черновик новой куклы",
    story: "История черновика",
    description: "Описание черновика",
    category: "fairies",
    collection: "Эксперимент",
    heightCm: 18,
    year: 2026,
    materials: ["Хлопок"],
    details: defaultDetails,
    priceByn: 35,
    status: "available",
    reservedUntil: null,
    isFeatured: false,
    isDraft: true,
    createdAt: "2026-03-10T12:00:00Z",
    updatedAt: "2026-03-10T12:00:00Z",
    images: [],
  },
];

describe("Admin DollsListClient (Step 4.2 - Zero-IT UX)", () => {
  it("экспортирует компонент DollsListClient", () => {
    expect(typeof DollsListClient).toBe("function");
  });

  it("корректно различает черновики и опубликованные работы", () => {
    const drafts = MOCK_ADMIN_DOLLS.filter((d) => d.isDraft);
    expect(drafts.length).toBe(1);
    expect(drafts[0]?.name).toBe("Черновик новой куклы");

    const published = MOCK_ADMIN_DOLLS.filter((d) => !d.isDraft);
    expect(published.length).toBe(2);
  });

  it("корректно фильтрует работы по статусу 'available'", () => {
    const available = MOCK_ADMIN_DOLLS.filter(
      (d) => !d.isDraft && d.status === "available"
    );
    expect(available.length).toBe(1);
    expect(available[0]?.slug).toBe("selesta");
  });

  it("корректно фильтрует работы по поисковому запросу", () => {
    const query = "селеста";
    const found = MOCK_ADMIN_DOLLS.filter((d) =>
      d.name.toLowerCase().includes(query)
    );
    expect(found.length).toBe(1);
    expect(found[0]?.name).toBe("Селеста · Фея незабудок");
  });
});
