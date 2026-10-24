"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  MessageSquareHeart,
  SlidersHorizontal,
} from "lucide-react";
import { useAdminLiveSync } from "./AdminLiveSyncProvider";

export function AdminBottomNav() {
  const pathname = usePathname();
  const { activeReservations, pendingOrdersCount, newRequestsCount } =
    useAdminLiveSync();

  const navItems = [
    {
      href: "/admin/kukly",
      label: "Куклы",
      icon: Sparkles,
      badge:
        activeReservations.length > 0
          ? `${activeReservations.length} ⏳`
          : undefined,
      badgeVariant: "amber",
    },
    {
      href: "/admin/zakazy",
      label: "Заказы",
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
      badgeVariant: "terracotta",
    },
    {
      href: "/admin/zayavki",
      label: "Заявки",
      icon: MessageSquareHeart,
      badge: newRequestsCount > 0 ? String(newRequestsCount) : undefined,
      badgeVariant: "terracotta",
    },
    {
      href: "/admin/nastrojki",
      label: "Настройки",
      icon: SlidersHorizontal,
      badge: undefined,
      badgeVariant: "terracotta",
    },
  ];

  return (
    <nav
      aria-label="Навигация панели мастера"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-linen-dark pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/kukly"
              ? pathname.startsWith("/admin/kukly") || pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[50px] py-1 px-2 rounded-2xl transition-all ${
                isActive
                  ? "bg-terracotta/10 text-terracotta font-bold border border-terracotta/25 shadow-2xs"
                  : "text-muted hover:text-espresso hover:bg-linen/40"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-2.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full leading-none whitespace-nowrap shadow-xs ${
                      item.badgeVariant === "amber"
                        ? "bg-amber-500 text-white"
                        : "bg-terracotta text-white"
                    }`}
                  >
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
