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
