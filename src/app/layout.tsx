import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF8F5",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dollshop.by"),
  title: {
    default: "DollShop — Авторские куклы-феи ручной работы (OOAK)",
    template: "%s | DollShop",
  },
  description:
    "Цифровой арт-бутик и мастерская авторских интерьерных фей и ангелов ручной работы из хлопка, дерева и ромашкового фатина. Отправка почтой по всей Беларуси или самовывоз в Минске.",
  keywords: [
    "авторские куклы",
    "текстильные феи",
    "куклы ручной работы",
    "интерьерные куклы",
    "ангелы ручной работы",
    "подарки Минск",
    "купить куклу Беларусь",
    "OOAK",
    "макраме",
  ],
  authors: [{ name: "Алёна Прокопенко" }],
  creator: "ИП Прокопенко А. В.",
  openGraph: {
    type: "website",
    locale: "ru_BY",
    url: "https://dollshop.by",
    siteName: "DollShop",
    title: "DollShop — Авторские куклы-феи ручной работы",
    description:
      "Тёплые интерьерные куклы-феи и ангелы ручной работы. Единственный экземпляр (OOAK). Отправка почтой по всей Беларуси или самовывоз в Минске.",
    images: [
      {
        url: "/mock/dolls/fairy-blue-1.jpg",
        width: 896,
        height: 1200,
        alt: "Авторская кукла-фея Селеста — студийное фото",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DollShop — Авторские куклы-феи ручной работы",
    description:
      "Тёплые интерьерные куклы-феи и ангелы ручной работы. Отправка почтой по всей Беларуси или самовывоз в Минске.",
    images: ["/mock/dolls/fairy-blue-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DollShop",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-alabaster font-sans text-espresso selection:bg-terracotta/15 selection:text-terracotta">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
