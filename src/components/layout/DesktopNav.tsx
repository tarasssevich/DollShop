"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkItem {
  href: string;
  label: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: "/kukly", label: "Куклы в наличии" },
  { href: "/na-zakaz", label: "На заказ" },
  { href: "/galereya", label: "Галерея" },
  { href: "/o-mastere", label: "О мастере" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основное меню"
      className="hidden md:flex items-center gap-1.5 text-sm font-medium"
    >
      {NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3.5 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5 ${
              isActive
                ? "bg-terracotta/10 text-terracotta font-semibold border border-terracotta/25 shadow-2xs"
                : "text-espresso/80 hover:text-terracotta hover:bg-linen/60"
            }`}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0 animate-pulse" />
            )}
            <span>{link.label}</span>
          </Link>
        );
      })}

      <div className="h-4 w-px bg-linen-dark mx-1" />

      {/* Вспомогательные страницы */}
      <Link
        href="/styleguide"
        className={`px-2.5 py-1 text-xs uppercase tracking-wider rounded-full transition-all ${
          pathname === "/styleguide"
            ? "bg-terracotta/10 text-terracotta font-semibold border border-terracotta/20"
            : "text-muted hover:text-espresso hover:bg-linen/40"
        }`}
      >
        Styleguide
      </Link>

      <Link
        href="/demo"
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all border ${
          pathname === "/demo"
            ? "bg-terracotta text-white border-terracotta shadow-xs"
            : "bg-terracotta/10 text-terracotta hover:bg-terracotta/20 border-terracotta/20"
        }`}
      >
        Тест-центр ⚡
      </Link>
    </nav>
  );
}
