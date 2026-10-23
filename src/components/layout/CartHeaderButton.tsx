"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { getActiveReservationsAction } from "@/actions/reserve";
import { CART_CHANGED_EVENT } from "@/lib/reservation/events";

export function CartHeaderButton() {
  const pathname = usePathname();
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    getActiveReservationsAction()
      .then((items) => setCount(items.length))
      .catch(() => {});
  }, []);

  // Обновляем при навигации и при событии брони/отмены
  React.useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  React.useEffect(() => {
    window.addEventListener(CART_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CART_CHANGED_EVENT, refresh);
  }, [refresh]);

  return (
    <Link
      href="/cart"
      aria-label={
        count > 0 ? `Корзина (кукол в брони: ${count})` : "Корзина пуста"
      }
      className="relative inline-flex h-9 items-center gap-2 rounded-full border border-linen-dark bg-alabaster px-3.5 text-sm font-medium text-espresso transition-colors hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
    >
      <ShoppingBag className="h-4 w-4" />
      <span>Корзина</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-bold text-white shadow-xs">
          {count}
        </span>
      )}
    </Link>
  );
}
