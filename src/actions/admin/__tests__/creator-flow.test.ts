import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveProductAction } from "../products";
import { saveProductMediaAction, reorderProductMediaAction } from "../media";
import { generateDollStoryAction } from "../ai";
import { getDollBySlug, getDolls } from "@/lib/data/catalog";
import { client } from "@/db/client";
import * as guardModule from "@/lib/auth/guard";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Step 4.9 — Zero-IT UX: Сценарий «Кукла за 60 секунд»", () => {
  const testTitle = `Фея Магнолия ${Date.now()}`;
  let createdProductId: string | null = null;

  beforeEach(() => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Мастер",
        email: "master@dollshop.by",
        role: "admin",
      },
      session: {
        id: "sess-1",
        expiresAt: new Date(Date.now() + 3600000),
        token: "tok-1",
        userId: "a0000000-0000-0000-0000-000000000001",
      },
    });
  });

  afterEach(async () => {
    if (createdProductId) {
      await client`DELETE FROM product_media WHERE product_id = ${createdProductId}::uuid`;
      await client`DELETE FROM products WHERE id = ${createdProductId}::uuid`;
    }
  });

  it("успешно выполняет полный цикл публикации куклы со смартфона: фото, авто-slug, AI-история и моментальное появление на витрине", async () => {
    const startTime = Date.now();

    // 1. Инициализация черновика куклы (автосохранение перед загрузкой фото)
    const draftRes = await saveProductAction({
      title: testTitle,
      story: "Черновик описания",
      price: 65,
      heightCm: 20,
      collection: "Цветочные феи",
      materials: ["Эко-хлопок макраме", "Резное дерево"],
      status: "draft",
    });

    expect(draftRes.success).toBe(true);
    if (!draftRes.success) return;
    expect(draftRes.data.id).toBeDefined();
    createdProductId = draftRes.data.id;

    // 2. Добавление фотографий куклы и выбор главной обложки (⭐)
    const media1 = await saveProductMediaAction({
      productId: createdProductId,
      storageKey: `mock/dolls/magnolia-1-${Date.now()}.webp`,
      url: "/mock/dolls/fairy-blue-1.jpg",
      blurDataUrl: "data:image/svg+xml;base64,PHN2Zy8+",
      width: 1200,
      height: 1600,
      alt: testTitle,
    });
    expect(media1.success).toBe(true);
    if (!media1.success) return;

    const media2 = await saveProductMediaAction({
      productId: createdProductId,
      storageKey: `mock/dolls/magnolia-2-${Date.now()}.webp`,
      url: "/mock/dolls/fairy-blue-2.jpg",
      blurDataUrl: "data:image/svg+xml;base64,PHN2Zy8+",
      width: 1200,
      height: 1600,
      alt: `${testTitle} — детали`,
    });
    expect(media2.success).toBe(true);
    if (!media2.success) return;

    // Меняем порядок фото (media2 делаем обложкой через reorder)
    const reorderRes = await reorderProductMediaAction({
      productId: createdProductId,
      mediaIds: [media2.media.id, media1.media.id],
    });
    expect(reorderRes.success).toBe(true);

    // 3. Вызов AI-ассистента «✨ Помочь придумать историю» (offline fallback mode)
    const aiStoryRes = await generateDollStoryAction({
      title: testTitle,
      materials: ["хлопок", "дерево", "ромашковый фатин"],
      mode: "warmer",
    });
    expect(aiStoryRes.success).toBe(true);
    if (!aiStoryRes.success) return;
    expect(aiStoryRes.story).toContain("Магнолия");

    // 4. Финальная публикация куклы в статусе «🟢 Ищет дом» (available)
    const publishRes = await saveProductAction({
      id: createdProductId,
      title: testTitle,
      story: aiStoryRes.story,
      price: 65,
      heightCm: 22,
      collection: "Цветочные феи 2026",
      materials: ["Эко-хлопок макраме", "Резное дерево", "Ромашковый фатин", "Мини-букетик"],
      status: "available",
      isFeatured: true,
      details: {
        wingMaterial: "Берёзовый шпон",
        hairMaterial: "Хлопковая пряжа",
        dressMaterial: "Ромашковый фатин",
        bouquetDetails: "Букетик незабудок",
        hangingLoopIncluded: true,
        boxIncluded: true,
        certificateIncluded: true,
      },
    });

    expect(publishRes.success).toBe(true);
    if (!publishRes.success) return;

    // 5. Проверка витрины: кукла сразу доступна покупателям в getDolls и getDollBySlug
    const availableDolls = await getDolls({ status: "available" });
    const foundOnStorefront = availableDolls.find((d) => d.id === createdProductId);
    expect(foundOnStorefront).toBeDefined();
    expect(foundOnStorefront?.name).toBe(testTitle);
    expect(foundOnStorefront?.priceByn).toBe(65);
    expect(foundOnStorefront?.images.length).toBe(2);
    // Проверяем, что первая картинка — именно назначенная обложка media2
    expect(foundOnStorefront?.images[0]?.url).toBe("/mock/dolls/fairy-blue-2.jpg");

    // Страница куклы открывается по ее auto-slug
    const dollPageData = await getDollBySlug(publishRes.data.slug);
    expect(dollPageData).toBeDefined();
    expect(dollPageData?.slug).toBe(publishRes.data.slug);
    expect(dollPageData?.story).toBe(aiStoryRes.story);
    expect(dollPageData?.details.dressMaterial).toBe("Ромашковый фатин");

    // 6. Тайминг: весь серверный процесс занимает секунды (Zero-IT UX)
    const durationMs = Date.now() - startTime;
    expect(durationMs).toBeLessThan(5000);
  });
});
