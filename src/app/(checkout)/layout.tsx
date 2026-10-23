import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-alabaster">
      {/* Минималистичный спокойный хедер чекаута без отвлекающих ссылок */}
      <header className="sticky top-0 z-30 border-b border-linen-dark bg-alabaster/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
            aria-label="На главную"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-terracotta/20 shadow-sm">
              <Image
                src="/images/logo.webp"
                alt="DollShop"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-serif text-lg font-medium text-espresso block leading-tight">
                DollShop
              </span>
              <span className="text-[11px] text-muted block leading-none">
                Оформление заказа
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs text-muted">
            <div className="hidden sm:flex items-center gap-1.5 text-sage-dark bg-sage-subtle/80 px-3 py-1 rounded-full border border-sage/20">
              <ShieldCheck className="h-4 w-4 text-sage" />
              <span>Защищенное бронирование</span>
            </div>
            <Link
              href="/kukly"
              className="inline-flex items-center gap-1 text-muted hover:text-terracotta transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>В каталог</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1">{children}</main>

      {/* Лаконичный юридический футер чекаута */}
      <footer className="border-t border-linen-dark bg-alabaster/80 py-6 text-center text-xs text-muted">
        <div className="mx-auto max-w-4xl px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>ИП Игнатович А. В.</span>
            <span>·</span>
            <span>УНП 193850123</span>
            <span>·</span>
            <span>Торговый реестр РБ № 589124 от 14.02.2025</span>
          </div>
          <p className="text-[11px] text-muted/80">
            Каждая кукла изготавливается вручную в единственном экземпляре. Почта по Беларуси или самовывоз в Минске.
          </p>
        </div>
      </footer>
    </div>
  );
}
