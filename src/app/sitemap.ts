import type { MetadataRoute } from "next";
import { getDolls } from "@/lib/data/catalog";

/**
 * Динамическая генерация sitemap.xml для поисковых систем.
 * Включает все общедоступные страницы арт-бутика и актуальные карточки авторских кукол.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";

  // Статические разделы сайта
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kukly`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/na-zakaz`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/galereya`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/o-mastere`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dostavka-i-oplata`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/oferta`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politika-konfidencialnosti`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Динамические карточки опубликованных кукол
  try {
    const dolls = await getDolls({ includeDrafts: false });

    const dollRoutes: MetadataRoute.Sitemap = dolls.map((doll) => {
      const dollImages = (doll.images || []).map((img) =>
        img.url.startsWith("http") ? img.url : `${baseUrl}${img.url}`
      );

      return {
        url: `${baseUrl}/kukly/${doll.slug}`,
        lastModified: doll.updatedAt ? new Date(doll.updatedAt) : new Date(),
        changeFrequency: doll.status === "available" ? "daily" : "weekly",
        priority: doll.status === "available" ? 0.9 : 0.7,
        images: dollImages.length > 0 ? dollImages : undefined,
      };
    });

    return [...staticRoutes, ...dollRoutes];
  } catch (error) {
    console.error("Ошибка при генерации dynamic sitemap для кукол:", error);
    return staticRoutes;
  }
}
