import { describe, it, expect } from "vitest";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
} from "../JsonLd";
import type { Doll } from "@/types/domain";

describe("Schema.org JSON-LD Generators", () => {
  const mockDoll: Doll = {
    id: "test-doll-1",
    slug: "selesta",
    name: "Селеста",
    category: "fairies",
    collection: "Весенняя капель",
    priceByn: 280,
    status: "available",
    reservedUntil: null,
    heightCm: 28,
    year: 2026,
    materials: ["Хлопок макраме", "Дерево", "Фатин с ромашками"],
    description: "Нежная фея в мятном платье с вышитыми ромашками.",
    story: "Создана в весенней тишине...",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T12:00:00.000Z",
    details: {
      wingMaterial: "Дерево",
      hairMaterial: "Хлопок",
      dressMaterial: "Фатин",
      bouquetDetails: "Незабудки",
      hangingLoopIncluded: true,
      boxIncluded: true,
      certificateIncluded: true,
    },
    images: [
      {
        id: "img-1",
        url: "/mock/dolls/fairy-blue-1.jpg",
        blurDataUrl: "data:image/webp;base64,mock",
        alt: "Селеста",
        width: 896,
        height: 1200,
        isCover: true,
      },
    ],
  };

  it("генерирует валидную схему Product с ценой в BYN и статусом InStock", () => {
    const schema = generateProductSchema(mockDoll, "https://dollshop.by");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe("Селеста");
    expect(schema.sku).toBe("selesta");
    expect(schema.image).toEqual(["https://dollshop.by/mock/dolls/fairy-blue-1.jpg"]);

    const offers = schema.offers;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.priceCurrency).toBe("BYN");
    expect(offers.price).toBe("280.00");
    expect(offers.availability).toBe("https://schema.org/InStock");
    expect(offers.shippingDetails.shippingDestination.addressCountry).toBe("BY");
    expect(offers.hasMerchantReturnPolicy.applicableCountry).toBe("BY");
  });

  it("корректно выставляет availability для забронированных и проданных кукол", () => {
    const reservedDoll: Doll = { ...mockDoll, status: "reserved" };
    const reservedSchema = generateProductSchema(reservedDoll, "https://dollshop.by");
    expect(reservedSchema.offers.availability).toBe("https://schema.org/PreOrder");

    const soldDoll: Doll = { ...mockDoll, status: "sold" };
    const soldSchema = generateProductSchema(soldDoll, "https://dollshop.by");
    expect(soldSchema.offers.availability).toBe("https://schema.org/SoldOut");
  });

  it("генерирует валидную схему BreadcrumbList с 1-based нумерацией", () => {
    const breadcrumbs = [
      { name: "Главная", url: "https://dollshop.by/" },
      { name: "Куклы в наличии", url: "https://dollshop.by/kukly" },
      { name: "Селеста", url: "https://dollshop.by/kukly/selesta" },
    ];

    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Главная",
      item: "https://dollshop.by/",
    });
    expect(schema.itemListElement[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: "Селеста",
      item: "https://dollshop.by/kukly/selesta",
    });
  });

  it("генерирует схему LocalBusiness с валютой BYN и локализацией в Минске", () => {
    const schema = generateLocalBusinessSchema("https://dollshop.by");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("LocalBusiness");
    expect(schema.currenciesAccepted).toBe("BYN");
    expect(schema.address.addressLocality).toBe("Минск");
    expect(schema.address.addressCountry).toBe("BY");
  });
});
