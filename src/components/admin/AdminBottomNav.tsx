"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, MessageSquareHeart, SlidersHorizontal } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/kukly",
    label: "Куклы",
    icon: Sparkles,
  },
  {
    href: "/admin/zakazy",
    label: "Заказы",
    icon: ShoppingBag,
  },
  {
    href: "/admin/zayavki",
    label: "Заявки",
    icon: MessageSquareHeart,
  },
  {
    href: "/admin/nastrojki",
    label: "Настройки",
    icon: SlidersHorizontal,
  },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Навигация панели мастера"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-linen-dark pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/kukly"
              ? pathname.startsWith("/admin/kukly") || pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition ${
                isActive
                  ? "text-terracotta font-semibold"
                  : "text-muted hover:text-espresso"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-terracotta text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 leading-tight tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
