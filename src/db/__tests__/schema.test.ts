import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../client";
import {
  products,
  productMedia,
  reservations,
  orders,
  orderItems,
  customRequests,
  siteSettings,
  rateLimits,
} from "../schema";

describe("Drizzle Schema and PostgreSQL 18 Constraints (Step 3.2)", () => {
  const testSlug = `test-fairy-${Date.now()}`;

  beforeEach(async () => {
    // Чистим тестовые записи по slug
    await db.delete(products).where(eq(products.slug, testSlug));
  });

  it("успешно создает куклу с полной спецификацией specs и читает её обратно", async () => {
    const inserted = await db
      .insert(products)
      .values({
        slug: testSlug,
        title: "Тестовая Фея Незабудка",
        story: "Волшебная фея, созданная вручную для проверки схемы базы данных.",
        specs: {
          height_cm: 20,
          materials: ["эко-хлопок", "бук", "фатин с ромашками"],
          wing_type: "лазерные деревянные крылья",
          details: {
            wingMaterial: "фанера березовая 3мм",
            hangingLoopIncluded: true,
          },
        },
        price: "55.00",
        currency: "BYN",
        status: "available",
        isFeatured: true,
      })
      .returning();

    expect(inserted).toHaveLength(1);
    const product = inserted[0];
    expect(product?.id).toBeDefined();
    expect(product?.title).toBe("Тестовая Фея Незабудка");
    expect(product?.price).toBe("55.00");
    expect(product?.currency).toBe("BYN");
    expect(product?.specs.height_cm).toBe(20);
    expect(product?.specs.materials).toContain("бук");
  });

  it("соблюдает CHECK-ограничение: отклоняет отрицательную цену", async () => {
    let thrownError: unknown = null;
    try {
      await db.insert(products).values({
        slug: `${testSlug}-negative`,
        title: "Невалидная кукла",
        story: "Тест отрицательной цены",
        specs: { height_cm: 15, materials: ["хлопок"] },
        price: "-10.00",
        currency: "BYN",
        status: "draft",
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    const pgError = (thrownError as { cause?: { code?: string; constraint_name?: string; message?: string } })?.cause;
    expect(pgError?.code).toBe("23514"); // PostgreSQL CHECK_VIOLATION
    expect(pgError?.constraint_name || pgError?.message).toMatch(/product_price_non_negative/i);
  });

  it("соблюдает CHECK-ограничение: отклоняет любую валюту, кроме BYN", async () => {
    let thrownError: unknown = null;
    try {
      await db.insert(products).values({
        slug: `${testSlug}-currency`,
        title: "Невалидная валюта",
        story: "Тест валюты",
        specs: { height_cm: 15, materials: ["хлопок"] },
        price: "60.00",
        currency: "USD",
        status: "draft",
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    const pgError = (thrownError as { cause?: { code?: string; constraint_name?: string; message?: string } })?.cause;
    expect(pgError?.code).toBe("23514"); // PostgreSQL CHECK_VIOLATION
    expect(pgError?.constraint_name || pgError?.message).toMatch(/product_currency_byn/i);
  });

  it("поддерживает каскадное удаление медиа-файлов при удалении куклы", async () => {
    const [created] = await db
      .insert(products)
      .values({
        slug: `${testSlug}-cascade`,
        title: "Кукла для теста каскада",
        story: "Каскадное удаление",
        specs: { height_cm: 18, materials: ["хлопок"] },
        price: "49.00",
        currency: "BYN",
        status: "available",
      })
      .returning();

    expect(created).toBeDefined();

    // Добавляем медиа
    await db.insert(productMedia).values({
      productId: created!.id,
      url: "https://dollshop.by/media/test-cascade.webp",
      mediaType: "image",
      alt: "Фото феи",
      displayOrder: 1,
    });

    // Проверяем наличие медиа
    const mediaBefore = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, created!.id));
    expect(mediaBefore).toHaveLength(1);

    // Удаляем куклу
    await db.delete(products).where(eq(products.id, created!.id));

    // Проверяем, что медиа автоматически удалилось (ON DELETE CASCADE)
    const mediaAfter = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, created!.id));
    expect(mediaAfter).toHaveLength(0);
  });

  it("триггер update_products_updated_at автоматически обновляет поле updated_at", async () => {
    const [created] = await db
      .insert(products)
      .values({
        slug: `${testSlug}-trigger`,
        title: "Кукла до обновления",
        story: "Тест триггера updated_at",
        specs: { height_cm: 18, materials: ["хлопок"] },
        price: "50.00",
        currency: "BYN",
        status: "available",
      })
      .returning();

    const originalUpdatedAt = created!.updatedAt.getTime();

    // Небольшая задержка перед апдейтом
    await new Promise((res) => setTimeout(res, 50));

    const [updated] = await db
      .update(products)
      .set({ title: "Кукла после обновления названия" })
      .where(eq(products.id, created!.id))
      .returning();

    expect(updated!.title).toBe("Кукла после обновления названия");
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);

    // Cleanup
    await db.delete(products).where(eq(products.id, created!.id));
  });

  it("заказ генерирует уникальный public_token (UUIDv4) и автоинкрементный order_number", async () => {
    const [order] = await db
      .insert(orders)
      .values({
        customerName: "Татьяна Прокопенко",
        customerPhone: "+375291234567",
        contactChannel: "telegram",
        deliveryCity: "г. Минск",
        deliveryBranch: "Почтовое отделение № 42",
        totalAmount: "55.00",
        status: "pending",
        paymentMethod: "erip_invoice",
        pdConsentAt: new Date(),
      })
      .returning();

    expect(order).toBeDefined();
    expect(order!.orderNumber).toBeGreaterThan(0);
    expect(order!.publicToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Cleanup
    await db.delete(orders).where(eq(orders.id, order!.id));
  });

  it("связывает заказ с позицией order_items и проверяет защищенный FK ON DELETE RESTRICT", async () => {
    const [doll] = await db
      .insert(products)
      .values({
        slug: `${testSlug}-restrict`,
        title: "Кукла для заказа",
        story: "Тест restrict",
        specs: { height_cm: 20, materials: ["хлопок"] },
        price: "65.00",
        currency: "BYN",
        status: "available",
      })
      .returning();

    const [order] = await db
      .insert(orders)
      .values({
        customerName: "Анна",
        customerPhone: "+375298887766",
        contactChannel: "call",
        deliveryCity: "г. Брест",
        deliveryBranch: "ОПС № 12",
        totalAmount: "65.00",
        status: "pending",
        paymentMethod: "bank_transfer",
        pdConsentAt: new Date(),
      })
      .returning();

    const [item] = await db
      .insert(orderItems)
      .values({
        orderId: order!.id,
        productId: doll!.id,
        priceAtPurchase: "65.00",
      })
      .returning();

    expect(item).toBeDefined();
    expect(item!.priceAtPurchase).toBe("65.00");

    // Попытка удалить куклу, проданную в заказе, должна быть заблокирована RESTRICT
    let restrictError: unknown = null;
    try {
      await db.delete(products).where(eq(products.id, doll!.id));
    } catch (err) {
      restrictError = err;
    }
    expect(restrictError).toBeDefined();

    // Очистка заказа каскадом удаляет order_items
    await db.delete(orders).where(eq(orders.id, order!.id));
    // Теперь куклу можно удалить
    await db.delete(products).where(eq(products.id, doll!.id));
  });

  it("успешно создает и читает запись брони в reservations", async () => {
    const [doll] = await db
      .insert(products)
      .values({
        slug: `${testSlug}-reservation`,
        title: "Кукла для брони",
        story: "Тест брони",
        specs: { height_cm: 20, materials: ["хлопок"] },
        price: "60.00",
        currency: "BYN",
        status: "reserved",
      })
      .returning();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const [res] = await db
      .insert(reservations)
      .values({
        productId: doll!.id,
        tokenHash: "dummy_sha256_token_hash",
        expiresAt,
      })
      .returning();

    expect(res).toBeDefined();
    expect(res!.tokenHash).toBe("dummy_sha256_token_hash");

    // Удаление куклы каскадно удаляет бронь
    await db.delete(products).where(eq(products.id, doll!.id));
    const resAfter = await db
      .select()
      .from(reservations)
      .where(eq(reservations.productId, doll!.id));
    expect(resAfter).toHaveLength(0);
  });

  it("успешно сохраняет и извлекает заявку «Хочу похожую» custom_requests", async () => {
    const [request] = await db
      .insert(customRequests)
      .values({
        customerName: "Мария",
        customerPhone: "+375447654321",
        contactChannel: "viber",
        wishes: "Хочу точно такую же фею, но с розовыми крыльями",
        status: "new",
        pdConsentAt: new Date(),
      })
      .returning();

    expect(request).toBeDefined();
    expect(request!.customerName).toBe("Мария");
    expect(request!.contactChannel).toBe("viber");
    expect(request!.status).toBe("new");

    // Cleanup
    await db.delete(customRequests).where(eq(customRequests.id, request!.id));
  });

  it("поддерживает дефолтные настройки магазина site_settings и rate_limits", async () => {
    // Вставка настроек (ON CONFLICT DO NOTHING)
    await db
      .insert(siteSettings)
      .values({
        id: 1,
        legalSellerName: "ИП Прокопенко А. В.",
        deliveryCostBranch: "3.50",
        deliveryCostCourier: "5.50",
        freeDeliveryThreshold: "120.00",
      })
      .onConflictDoNothing();

    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    expect(settings).toBeDefined();
    expect(settings?.legalSellerName).toBe("ИП Прокопенко А. В.");
    expect(settings?.deliveryCostBranch).toBe("3.50");

    // Тест rate_limits
    const testKey = `rate:ip:127.0.0.1:${Date.now()}`;
    const [rate] = await db
      .insert(rateLimits)
      .values({
        key: testKey,
        windowStart: new Date(),
        count: 1,
      })
      .returning();

    expect(rate?.key).toBe(testKey);
    expect(rate?.count).toBe(1);

    await db.delete(rateLimits).where(eq(rateLimits.key, testKey));
  });
});
