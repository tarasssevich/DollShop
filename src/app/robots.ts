import type { MetadataRoute } from "next";

/**
 * Конфигурация robots.txt для поисковых систем (Google, Яндекс, Mail.ru).
 * Разрешает индексацию витрины, каталога кукол, галереи и юридических разделов.
 * Закрывает служебные маршруты: админку, корзину, чекаут, оплату и внутренние API.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/cart",
          "/cart/*",
          "/oformlenie",
          "/oformlenie/*",
          "/oplata",
          "/oplata/*",
          "/api",
          "/api/*",
          "/demo",
          "/demo/*",
        ],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/cart",
          "/cart/*",
          "/oformlenie",
          "/oformlenie/*",
          "/oplata",
          "/oplata/*",
          "/api",
          "/api/*",
          "/demo",
          "/demo/*",
        ],
        other: {
          "Clean-param":
            "utm_source&utm_medium&utm_campaign&utm_content&utm_term",
        },
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
