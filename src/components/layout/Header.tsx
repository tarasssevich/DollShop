import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Package } from "lucide-react";
import { Container } from "./Container";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";
import { CartHeaderButton } from "./CartHeaderButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-linen-dark/80 bg-alabaster/95 backdrop-blur-md transition-all">
      {/* Top micro-bar */}
      <div className="hidden border-b border-linen-dark/50 bg-linen/50 py-1.5 text-xs text-muted sm:block">
        <Container className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] tracking-wide">
            <Sparkles className="h-3 w-3 text-terracotta" />
            <span>Каждая кукла создается в единственном экземпляре (OOAK)</span>
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Минск, Беларусь</span>
            <span className="text-linen-dark">·</span>
            <span>Почта или самовывоз</span>
            <span className="text-linen-dark">·</span>
            <Link
              href="/moi-zakazy"
              className="text-espresso hover:text-terracotta transition-colors font-medium flex items-center gap-1"
            >
              <Package className="h-3 w-3 text-terracotta" />
              <span>Мои заказы</span>
            </Link>
            <span className="text-linen-dark">·</span>
            <a
              href="tel:+375291234567"
              className="text-espresso hover:text-terracotta transition-colors font-medium"
            >
              +375 (29) 123-45-67
            </a>
          </div>
        </Container>
      </div>

      {/* Main navigation bar */}
      <div className="py-3.5 sm:py-4">
        <Container className="flex items-center justify-between gap-4">
          {/* Brand Logo with Emblem */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-lg"
          >
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full overflow-hidden border border-linen-dark/80 bg-white shadow-2xs transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/images/logo-128.webp"
                alt="Логотип DollShop — Ателье авторских кукол"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-serif text-2xl sm:text-3xl font-light tracking-tight text-espresso transition-colors group-hover:text-terracotta">
                DollShop
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted font-sans font-medium mt-0.5">
                Ателье авторских кукол
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Active State */}
          <DesktopNav />

          {/* Actions & Mobile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/moi-zakazy"
              className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-full border border-linen-dark bg-alabaster px-3 text-xs font-medium text-espresso transition-colors hover:bg-linen hover:border-terracotta/40"
            >
              <Package className="h-3.5 w-3.5 text-terracotta" />
              <span>Мои заказы</span>
            </Link>

            {/* Cart & Reservation Button */}
            <CartHeaderButton />

            {/* Mobile Navigation Trigger */}
            <MobileNav />
          </div>
        </Container>
      </div>
    </header>
  );
}
