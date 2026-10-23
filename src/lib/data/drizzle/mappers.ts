import type { Doll, DollCategory, DollStatus, DollImage, DollDetails } from "@/types/domain";
import type { Product, ProductMediaItem, SiteSettingsRecord } from "@/db/schema";

/**
 * Преобразование статуса БД в статус предметной области витрины (DollStatus).
 */
export function mapDbStatusToDollStatus(status: Product["status"]): DollStatus {
  switch (status) {
    case "available":
      return "available";
    case "reserved":
      return "reserved";
    case "sold":
      return "sold";
    case "made_to_order":
      return "in_progress";
    case "draft":
    default:
      return "available";
  }
}

/**
 * Преобразование медиа-записи БД в доменный объект DollImage.
 */
export function mapDbMediaToDollImage(media: ProductMediaItem): DollImage {
  return {
    id: media.id,
    url: media.url,
    blurDataUrl:
      media.blurDataUrl ||
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0VGRTYiLz48L3N2Zz4=",
    alt: media.alt || "Авторская кукла-фея ручной работы",
    width: media.width || 896,
    height: media.height || 1200,
    isCover: media.displayOrder === 0,
  };
}

/**
 * Преобразование строки products и массива product_media в доменную модель Doll.
 */
export function mapDbProductToDoll(
  product: Product,
  mediaItems: ProductMediaItem[] = []
): Doll {
  const specs = product.specs;

  const sortedMedia = [...mediaItems].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const images = sortedMedia.map(mapDbMediaToDollImage);

  const category = (specs.category as DollCategory) || "fairies";

  const details: DollDetails = {
    wingMaterial:
      specs.details?.wingMaterial ||
      specs.wing_type ||
      "Берёзовое дерево, ажурная лазерная гравировка",
    hairMaterial:
      specs.details?.hairMaterial ||
      specs.hair_color ||
      "100% хлопковая пряжа макраме",
    dressMaterial:
      specs.details?.dressMaterial ||
      specs.dress_color ||
      "Витой хлопковый шнур и фатин с ромашками",
    bouquetDetails:
      specs.details?.bouquetDetails ||
      specs.bouquet ||
      "Миниатюрный букетик незабудок",
    hangingLoopIncluded: specs.details?.hangingLoopIncluded ?? true,
    boxIncluded: specs.details?.boxIncluded ?? true,
    certificateIncluded: specs.details?.certificateIncluded ?? true,
  };

  return {
    id: product.id,
    slug: product.slug,
    name: product.title,
    category,
    collection: specs.collection || "Цветочные феи",
    priceByn: parseFloat(product.price),
    status: mapDbStatusToDollStatus(product.status),
    reservedUntil: product.reservedUntil
      ? product.reservedUntil.toISOString()
      : null,
    heightCm: specs.height_cm || 20,
    year: specs.year || 2026,
    materials: specs.materials || ["эко-хлопок", "дерево"],
    description: product.story,
    story: product.story,
    details,
    images,
    isFeatured: product.isFeatured,
    isDraft: product.status === "draft",
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type DomainSiteSettings = {
  checkoutMode: string;
  allowedPaymentMethods: string[];
  reservationTtlMinutes: number;
  eripHoldHours: number;
  deliveryCostBranch: number;
  deliveryCostCourier: number;
  freeDeliveryThreshold: number;
  legalSellerName: string;
  legalUnp: string;
  legalTradeRegistryNum: string;
  legalAddress: string;
  contactEmail: string;
  contactPhone: string;
  telegramChannel: string;
  instagramProfile: string;
  aboutMasterText?: string;
  paymentInstructionsErip?: string;
};

export function mapDbSiteSettingsToDomain(
  settings: SiteSettingsRecord
): DomainSiteSettings {
  return {
    checkoutMode: settings.checkoutMode,
    allowedPaymentMethods: settings.allowedPaymentMethods,
    reservationTtlMinutes: settings.reservationTtlMinutes,
    eripHoldHours: settings.eripHoldHours,
    deliveryCostBranch: parseFloat(settings.deliveryCostBranch),
    deliveryCostCourier: parseFloat(settings.deliveryCostCourier),
    freeDeliveryThreshold: parseFloat(settings.freeDeliveryThreshold),
    legalSellerName: settings.legalSellerName,
    legalUnp: settings.legalUnp,
    legalTradeRegistryNum: settings.legalTradeRegistryNum,
    legalAddress: settings.legalAddress,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    telegramChannel: settings.telegramChannel || "https://t.me/dollshop_by",
    instagramProfile:
      settings.instagramProfile || "https://instagram.com/dollshop.by",
    aboutMasterText: settings.aboutMasterText || undefined,
    paymentInstructionsErip: settings.paymentInstructionsErip || undefined,
  };
}
