import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dollshop.by"),
  title: "DollShop — Авторские куклы-феи ручной работы (OOAK)",
  description: "Цифровой арт-бутик и мастерская авторских интерьерных фей и ангелов ручной работы.",
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
