/**
 * Реестр тегов кэша Next.js ISR для DollShop.
 * Позволяет точечно сбрасывать кэш при обновлении кукол, брони или настроек.
 */
export const CACHE_TAGS = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  settings: "settings",
  gallery: "gallery",
} as const;

export type CacheTag =
  | typeof CACHE_TAGS.products
  | typeof CACHE_TAGS.settings
  | typeof CACHE_TAGS.gallery
  | `product:${string}`;

/**
 * Проверяет, принадлежит ли тег допустимому пространству имен кэша DollShop.
 */
export function isValidCacheTag(tag: string): tag is CacheTag {
  if (
    tag === CACHE_TAGS.products ||
    tag === CACHE_TAGS.settings ||
    tag === CACHE_TAGS.gallery
  ) {
    return true;
  }
  if (tag.startsWith("product:")) {
    const slug = tag.slice("product:".length);
    return slug.length >= 1 && slug.length <= 120 && /^[a-z0-9-]+$/.test(slug);
  }
  return false;
}
