import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { products, productMedia, siteSettings } from "../schema";
import {
  mapDbProductToDoll,
  mapDbSiteSettingsToDomain,
} from "@/lib/data/drizzle/mappers";

describe("Database Seed and Drizzle Mappers (Step 3.5)", () => {
  it("база данных успешно наполнена 13 куклами из сида", async () => {
    const allProducts = await db.select().from(products);
    expect(allProducts.length).toBeGreaterThanOrEqual(13);

    const selesta = allProducts.find((p) => p.slug === "selesta");
    expect(selesta).toBeDefined();
    expect(selesta?.title).toContain("Селеста");
    expect(selesta?.price).toBe("55.00");
    expect(selesta?.currency).toBe("BYN");
    expect(selesta?.status).toBe("available");
  });

  it("фотографии кукол сохранены в таблице product_media", async () => {
    const allMedia = await db.select().from(productMedia);
    expect(allMedia.length).toBeGreaterThan(0);

    const selesta = await db
      .select()
      .from(products)
      .where(eq(products.slug, "selesta"));

    const selestaMedia = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, selesta[0]!.id));

    expect(selestaMedia.length).toBeGreaterThanOrEqual(2);
    expect(selestaMedia[0]?.url).toContain("fairy-blue");
  });

  it("маппер mapDbProductToDoll корректно преобразует запись БД в доменную модель Doll", async () => {
    const [dbProduct] = await db
      .select()
      .from(products)
      .where(eq(products.slug, "selesta"));

    const media = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, dbProduct!.id));

    const doll = mapDbProductToDoll(dbProduct!, media);

    expect(doll.id).toBe(dbProduct!.id);
    expect(doll.slug).toBe("selesta");
    expect(doll.name).toContain("Селеста");
    expect(doll.priceByn).toBe(55);
    expect(doll.status).toBe("available");
    expect(doll.materials).toContain("100% хлопковая пряжа макраме");
    expect(doll.details.hangingLoopIncluded).toBe(true);
    expect(doll.images.length).toBeGreaterThanOrEqual(2);
    expect(doll.images[0]?.isCover).toBe(true);
  });

  it("маппер mapDbSiteSettingsToDomain корректно преобразует настройки магазина", async () => {
    const [settingsRow] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 1));

    expect(settingsRow).toBeDefined();
    const domainSettings = mapDbSiteSettingsToDomain(settingsRow!);

    expect(domainSettings.legalSellerName).toBe("ИП Прокопенко А. В.");
    expect(domainSettings.deliveryCostBranch).toBe(3.5);
    expect(domainSettings.deliveryCostCourier).toBe(5.5);
    expect(domainSettings.freeDeliveryThreshold).toBe(120);
    expect(domainSettings.allowedPaymentMethods).toContain("erip_invoice");
  });
});
