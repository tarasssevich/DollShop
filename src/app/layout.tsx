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
      <body className="flex min-h-full flex-col bg-alabaster font-sans text-espresso selection:bg-terracotta/15 selection:text-terracotta">
        {children}
      </body>
    </html>
  );
}
