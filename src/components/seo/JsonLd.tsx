import type { Doll } from "@/types/domain";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Базовый компонент безопасного рендеринга Schema.org микроразметки в формате JSON-LD.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Генерация схемы Schema.org/Product для карточки авторской куклы.
 * Включает точную цену в BYN, доступность для заказа и данные мастера.
 */
export function generateProductSchema(doll: Doll, baseUrl: string) {
  const images = (doll.images || []).map((img) =>
    img.url.startsWith("http") ? img.url : `${baseUrl}${img.url}`
  );

  let availability = "https://schema.org/InStock";
  if (doll.status === "reserved") {
    availability = "https://schema.org/PreOrder";
  } else if (doll.status === "sold") {
    availability = "https://schema.org/SoldOut";
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: doll.name,
    description: doll.description,
    image: images.length > 0 ? images : undefined,
    sku: doll.slug,
    category: "Интерьерные авторские куклы ручной работы",
    brand: {
      "@type": "Brand",
      name: "DollShop",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/kukly/${doll.slug}`,
      priceCurrency: "BYN",
      price: doll.priceByn.toFixed(2),
      priceValidUntil: "2027-12-31",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Person",
        name: "Алёна Прокопенко",
        jobTitle: "Мастер авторских кукол",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BY",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "5.00",
          currency: "BYN",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BY",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "d",
          },
        },
      },
    },
  };
}

/**
 * Генерация схемы Schema.org/BreadcrumbList для навигационных цепочек.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Генерация схемы Schema.org/LocalBusiness для арт-бутика в Беларуси.
 */
export function generateLocalBusinessSchema(
  baseUrl: string,
  settings?: {
    contactPhone?: string;
    legalSellerName?: string;
    legalAddress?: string;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings?.legalSellerName
      ? `DollShop — ${settings.legalSellerName}`
      : "DollShop — Авторские куклы ручной работы",
    description:
      "Мастерская и цифровой арт-бутик интерьерных кукол-фей ручной работы. Единственный экземпляр (OOAK). Минск, Беларусь.",
    url: baseUrl,
    logo: `${baseUrl}/favicon.png`,
    image: `${baseUrl}/mock/dolls/fairy-blue-1.jpg`,
    currenciesAccepted: "BYN",
    paymentAccepted: "Наличный расчет, Банковские карты (ЕРИП / WebPay)",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.legalAddress || undefined,
      addressLocality: "Минск",
      addressRegion: "Минская область",
      addressCountry: "BY",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: settings?.contactPhone || "+375 29 123-45-67",
      availableLanguage: ["Russian"],
    },
  };
}

/**
 * Компонент разметки авторской куклы для страницы товара.
 */
export function ProductJsonLd({
  doll,
  baseUrl = "https://dollshop.by",
}: {
  doll: Doll;
  baseUrl?: string;
}) {
  const schema = generateProductSchema(doll, baseUrl);
  return <JsonLd data={schema} />;
}

/**
 * Компонент разметки хлебных крошек.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = generateBreadcrumbSchema(items);
  return <JsonLd data={schema} />;
}

/**
 * Компонент разметки организации / бутика.
 */
export function OrganizationJsonLd({
  baseUrl = "https://dollshop.by",
}: {
  baseUrl?: string;
}) {
  const schema = generateLocalBusinessSchema(baseUrl);
  return <JsonLd data={schema} />;
}
