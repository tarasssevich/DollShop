import { unstable_cache } from "next/cache";
import { eq, desc, asc, and, ne } from "drizzle-orm";
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
}

/**
 * Внутренний запрос к БД для получения списка кукол.
 */
async function fetchDollsFromDb(filter: GetDollsFilter = {}): Promise<Doll[]> {
  const {
    status,
    category,
    featured,
    limit,
    offset = 0,
    includeDrafts = false,
  } = filter;

  // Базовые условия фильтрации
  const conditions = [];

  if (!includeDrafts) {
    conditions.push(ne(products.status, "draft"));
  }

  if (featured !== undefined) {
    conditions.push(eq(products.isFeatured, featured));
  }

  // Получаем список товаров
  const query = db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(products.sortOrder), desc(products.createdAt));

  const dbProducts = await query;
  if (dbProducts.length === 0) {
    return [];
  }

  // Загружаем все медиа для найденных кукол одним запросом
  const allMedia = await db
    .select()
    .from(productMedia)
    .orderBy(asc(productMedia.displayOrder));

  const mediaByProductId = new Map<string, typeof allMedia>();
  for (const media of allMedia) {
    const existing = mediaByProductId.get(media.productId) || [];
    existing.push(media);
    mediaByProductId.set(media.productId, existing);
  }

  const now = new Date();

  let list: Doll[] = dbProducts.map((p) =>
    mapDbProductToDoll(p, mediaByProductId.get(p.id) || [])
  );

  // Клиентская фильтрация по категории (хранится в jsonb specs)
  if (category) {
    list = list.filter((doll) => doll.category === category);
  }

  // Фильтрация по статусу с учетом истечения брони
  if (status) {
    list = list.filter((doll) => {
      const effStatus = getEffectiveDollStatus(doll, now);
      return effStatus === status;
    });
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
 * Кэшированная версия fetchDollsFromDb с тегом 'products'.
 */
const getDollsCached =
  process.env.NODE_ENV === "test"
    ? fetchDollsFromDb
    : unstable_cache(fetchDollsFromDb, ["products-list"], {
        tags: [CACHE_TAGS.products],
        revalidate: 3600,
      });

export async function getDolls(filter: GetDollsFilter = {}): Promise<Doll[]> {
  return getDollsCached(filter);
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
 * Получение куклы по slug с кэшированием по тегам 'products' и 'product:{slug}'.
 */
export async function getDollBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  if (process.env.NODE_ENV === "test") {
    return fetchDollBySlugFromDb(slug, options);
  }

  const cachedFn = unstable_cache(
    fetchDollBySlugFromDb,
    [`product-${slug}`],
    {
      tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)],
      revalidate: 3600,
    }
  );

  return cachedFn(slug, options);
}

/**
 * Поиск куклы по ее id в базе данных.
 */
export async function getDollById(id: string): Promise<Doll | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    );
  if (!isUuid) return null;

  const [dbProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

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
