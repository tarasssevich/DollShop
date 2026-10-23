import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "./Container";
import { MobileNav } from "./MobileNav";
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-espresso">
            <Link
              href="/kukly"
              className="relative py-1 transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta"
            >
              Куклы в наличии
            </Link>
            <Link
              href="/na-zakaz"
              className="relative py-1 transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta"
            >
              На заказ
            </Link>
            <Link
              href="/galereya"
              className="relative py-1 transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta"
            >
              Галерея
            </Link>
            <Link
              href="/o-mastere"
              className="relative py-1 transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta"
            >
              О мастере
            </Link>
            <Link
              href="/styleguide"
              className="relative py-1 text-xs uppercase tracking-wider text-muted hover:text-terracotta transition-colors"
            >
              Styleguide
            </Link>
            <Link
              href="/demo"
              className="relative rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/20 transition-colors border border-terracotta/20"
            >
              Тест-центр ⚡
            </Link>
          </nav>

          {/* Actions & Mobile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
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
