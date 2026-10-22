import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DollShop — Авторские куклы ручной работы (OOAK)",
  description: "Цифровой арт-бутик и галерея авторских коллекционных кукол ручной работы.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#FAF8F5] text-[#1C1917] selection:bg-[#9A5B42]/20 selection:text-[#9A5B42]">
        {children}
      </body>
    </html>
  );
}
