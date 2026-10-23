import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DollShop · Кабинет мастера",
    short_name: "DollShop",
    description: "Уютный цифровой бутик и мастерская авторских интерьерных кукол ручной работы",
    start_url: "/admin",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#9A5B42",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
