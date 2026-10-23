import "server-only";
import { unstable_cache } from "next/cache";
import { eq, desc, asc, and, ne, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productMedia, siteSettings } from "@/db/schema";
import type { Doll, DollStatus, DollCategory } from "@/types/domain";
import {
  mapDbProductToDoll,
  mapDbSiteSettingsToDomain,
  type DomainSiteSettings,
} from "./mappers";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getEffectiveDollStatus } from "../status";

export { getEffectiveDollStatus };

export interface GetDollsFilter {
  status?: DollStatus;
  category?: DollCategory;
  featured?: boolean;
  limit?: number;
  offset?: number;
  includeDrafts?: boolean;
  hasImages?: boolean;
}

const VALID_SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Внутренний запрос к БД для получения базового списка кукол (до фильтрации по текущему времени).
 */
async function fetchRawDollsFromDb(options: {
  featured?: boolean;
  includeDrafts?: boolean;
} = {}): Promise<Doll[]> {
  const { featured, includeDrafts = false } = options;

  const conditions = [];

  if (!includeDrafts) {
    conditions.push(ne(products.status, "draft"));
  }

  if (featured !== undefined) {
    conditions.push(eq(products.isFeatured, featured));
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(products.sortOrder), desc(products.createdAt));

  if (dbProducts.length === 0) {
    return [];
  }

  const productIds = dbProducts.map((p) => p.id);

  // Загружаем медиа ТОЛЬКО для найденных кукол одним запросом (inArray)
  const relevantMedia = await db
    .select()
    .from(productMedia)
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.displayOrder));

  const mediaByProductId = new Map<string, typeof relevantMedia>();
  for (const media of relevantMedia) {
    const existing = mediaByProductId.get(media.productId) || [];
    existing.push(media);
    mediaByProductId.set(media.productId, existing);
  }

  return dbProducts.map((p) =>
    mapDbProductToDoll(p, mediaByProductId.get(p.id) || [])
  );
}

/**
 * Прямая выборка опубликованных кукол из PostgreSQL.
 * Обеспечивает мгновенную 100% синхронизацию витрины покупателя и админ-панели мастера.
 */
const getRawDollsCached = fetchRawDollsFromDb;

/**
 * Получение списка кукол с фильтрацией по эффективному статусу (на текущий момент времени).
 */
export async function getDolls(filter: GetDollsFilter = {}): Promise<Doll[]> {
  const {
    status,
    category,
    featured,
    limit,
    offset = 0,
    includeDrafts = false,
    hasImages,
  } = filter;

  // Черновики запрашиваются только админкой напрямую без публичного кэша
  let list = includeDrafts
    ? await fetchRawDollsFromDb({ featured, includeDrafts: true })
    : await getRawDollsCached({ featured, includeDrafts: false });

  if (category) {
    list = list.filter((doll) => doll.category === category);
  }

  // Фильтрация по статусу с учетом живого времени истечения брони (вне кэша!)
  if (status) {
    const now = new Date();
    list = list.filter((doll) => {
      const effStatus = getEffectiveDollStatus(doll, now);
      return effStatus === status;
    });
  }

  // Фильтрация по наличию фотографий:
  // По умолчанию для публичной витрины (!includeDrafts) отображаются ТОЛЬКО куклы с фото.
  // Если hasImages явно передан (true / false), применяется переданное значение.
  const requirePhotos = hasImages !== undefined ? hasImages : !includeDrafts;
  if (requirePhotos) {
    list = list.filter(
      (doll) =>
        Array.isArray(doll.images) &&
        doll.images.length > 0 &&
        Boolean(doll.images[0]?.url)
    );
  }

  if (offset > 0) {
    list = list.slice(offset);
  }

  if (limit !== undefined && limit > 0) {
    list = list.slice(0, limit);
  }

  return list;
}

/**
 * Внутренний запрос куклы по slug.
 */
async function fetchDollBySlugFromDb(
  slug: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  const { includeDrafts = false } = options;

  const conditions = [eq(products.slug, slug)];
  if (!includeDrafts) {
    conditions.push(ne(products.status, "draft"));
  }

  const [dbProduct] = await db
    .select()
    .from(products)
    .where(and(...conditions));

  if (!dbProduct) {
    return null;
  }

  const media = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, dbProduct.id))
    .orderBy(asc(productMedia.displayOrder));

  return mapDbProductToDoll(dbProduct, media);
}

/**
 * Получение куклы по slug с защитой от инъекций в ключи кэша и тегами 'products' / 'product:{slug}'.
 */
export async function getDollBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  // Защита от мусорных/длинных URL (Cache Poisoning / DoS)
  if (!slug || slug.length > 120 || !VALID_SLUG_REGEX.test(slug)) {
    return null;
  }

  return fetchDollBySlugFromDb(slug, options);
}

/**
 * Поиск куклы по ее UUID в базе данных (по умолчанию скрывает черновики).
 */
export async function getDollById(
  id: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    );
  if (!isUuid) return null;

  const { includeDrafts = false } = options;
  const conditions = [eq(products.id, id)];
  if (!includeDrafts) {
    conditions.push(ne(products.status, "draft"));
  }

  const [dbProduct] = await db
    .select()
    .from(products)
    .where(and(...conditions));

  if (!dbProduct) return null;

  const media = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, id))
    .orderBy(asc(productMedia.displayOrder));

  return mapDbProductToDoll(dbProduct, media);
}

/**
 * Получение избранных кукол для главной страницы.
 */
export async function getFeaturedDolls(limit: number = 4): Promise<Doll[]> {
  return getDolls({ featured: true, limit });
}

/**
 * Получение кукол по статусу.
 */
export async function getDollsByStatus(status: DollStatus): Promise<Doll[]> {
  return getDolls({ status });
}

/**
 * Внутренний запрос настроек магазина.
 */
async function fetchSiteSettingsFromDb(): Promise<DomainSiteSettings> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (!row) {
    return {
      checkoutMode: "standard",
      allowedPaymentMethods: ["erip_invoice", "bank_transfer", "cod"],
      reservationTtlMinutes: 15,
      eripHoldHours: 24,
      deliveryCostBranch: 3.5,
      deliveryCostCourier: 5.5,
      freeDeliveryThreshold: 120,
      legalSellerName: "ИП Прокопенко А. В.",
      legalUnp: "193758204",
      legalTradeRegistryNum: "584920",
      legalAddress: "г. Минск, ул. Немига, 5",
      contactEmail: "master@dollshop.by",
      contactPhone: "+375 (29) 123-45-67",
      telegramChannel: "https://t.me/dollshop_by",
      instagramProfile: "https://instagram.com/dollshop.by",
    };
  }
  return mapDbSiteSettingsToDomain(row);
}

/**
 * Настройки магазина с кэшированием по тегу 'settings'.
 */
export async function getSiteSettings(): Promise<DomainSiteSettings> {
  if (process.env.NODE_ENV === "test") {
    return fetchSiteSettingsFromDb();
  }

  const cached = unstable_cache(fetchSiteSettingsFromDb, ["site-settings"], {
    tags: [CACHE_TAGS.settings],
    revalidate: 86400,
  });

  return cached();
}
