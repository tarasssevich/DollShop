import { eq } from "drizzle-orm";
import { db, client } from "./client";
import { products, productMedia, siteSettings } from "./schema";
import { MOCK_DOLLS } from "@/lib/data/mock/dolls";

/**
 * Идемпотентный сид базы данных DollShop.
 * Наполняет каталог авторскими куклами-феями, студийными фото и настройками магазина.
 */
export async function seedDatabase(): Promise<void> {
  console.log("🌱 Начало наполнения базы данных DollShop...");
  const startTime = Date.now();

  // 1. Настройки магазина (синглтон id=1)
  console.log("⚙️ Запись настроек магазина site_settings...");
  await db
    .insert(siteSettings)
    .values({
      id: 1,
      checkoutMode: "standard",
      allowedPaymentMethods: ["erip_invoice", "bank_transfer", "cod"],
      reservationTtlMinutes: 15,
      eripHoldHours: 24,
      deliveryCostBranch: "3.50",
      deliveryCostCourier: "5.50",
      freeDeliveryThreshold: "120.00",
      legalSellerName: "ИП Прокопенко А. В.",
      legalUnp: "193758204",
      legalTradeRegistryNum: "584920",
      legalAddress: "г. Минск, ул. Немига, 5",
      contactEmail: "master@dollshop.by",
      contactPhone: "+375 (29) 123-45-67",
      telegramChannel: "https://t.me/dollshop_by",
      instagramProfile: "https://instagram.com/dollshop.by",
      aboutMasterText:
        "Здравствуйте! Меня зовут Анастасия Прокопенко. Я создаю авторские текстильные интерьерные куклы-феи и ангелы ручной работы из эко-хлопка макраме, резного дерева и воздушного фатина.",
      paymentInstructionsErip:
        "Оплата через ЕРИП: Система «Расчет» (ЕРИП) -> Интернет-магазины/сервисы -> D -> Dollshop.by -> Номер заказа.",
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        legalSellerName: "ИП Прокопенко А. В.",
        deliveryCostBranch: "3.50",
        deliveryCostCourier: "5.50",
        freeDeliveryThreshold: "120.00",
      },
    });

  // 2. Куклы и медиа
  console.log(`🧚 Наполнение каталога (${MOCK_DOLLS.length} кукол)...`);

  for (let i = 0; i < MOCK_DOLLS.length; i++) {
    const mock = MOCK_DOLLS[i]!;

    let dbStatus: "available" | "reserved" | "sold" | "made_to_order" | "draft" = "available";
    if (mock.status === "sold") dbStatus = "sold";
    else if (mock.status === "reserved") dbStatus = "reserved";
    else if (mock.status === "in_progress") dbStatus = "made_to_order";
    if (mock.isDraft) dbStatus = "draft";

    const [savedProduct] = await db
      .insert(products)
      .values({
        slug: mock.slug,
        title: mock.name,
        story: mock.story,
        specs: {
          height_cm: mock.heightCm,
          materials: mock.materials,
          category: mock.category,
          collection: mock.collection,
          year: mock.year,
          details: {
            wingMaterial: mock.details.wingMaterial,
            hairMaterial: mock.details.hairMaterial,
            dressMaterial: mock.details.dressMaterial,
            bouquetDetails: mock.details.bouquetDetails,
            hangingLoopIncluded: mock.details.hangingLoopIncluded,
            boxIncluded: mock.details.boxIncluded,
            certificateIncluded: mock.details.certificateIncluded,
          },
        },
        price: mock.priceByn.toFixed(2),
        currency: "BYN",
        status: dbStatus,
        reservedUntil: mock.reservedUntil ? new Date(mock.reservedUntil) : null,
        isFeatured: Boolean(mock.isFeatured),
        sortOrder: i,
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          title: mock.name,
          story: mock.story,
          price: mock.priceByn.toFixed(2),
          status: dbStatus,
          reservedUntil: mock.reservedUntil ? new Date(mock.reservedUntil) : null,
          isFeatured: Boolean(mock.isFeatured),
          sortOrder: i,
        },
      })
      .returning();

    if (!savedProduct) continue;

    // Очищаем старые медиа для этой куклы и вставляем актуальные
    await db.delete(productMedia).where(eq(productMedia.productId, savedProduct.id));

    if (mock.images && mock.images.length > 0) {
      await db.insert(productMedia).values(
        mock.images.map((img, order) => ({
          productId: savedProduct.id,
          url: img.url,
          mediaType: "image" as const,
          displayOrder: order,
          blurDataUrl: img.blurDataUrl,
          width: img.width,
          height: img.height,
          alt: img.alt,
        }))
      );
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ База данных успешно наполнена за ${duration} мс!`);
}

// Запуск напрямую: npx tsx src/db/seed.ts
if (
  process.env.NODE_ENV !== "test" &&
  (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js"))
) {
  seedDatabase()
    .then(async () => {
      await client.end();
      process.exit(0);
    })
    .catch(async (err: unknown) => {
      console.error("❌ Ошибка сида базы данных:", err);
      await client.end();
      process.exit(1);
    });
}
