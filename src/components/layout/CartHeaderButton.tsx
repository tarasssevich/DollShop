"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveReservationAction } from "@/actions/reserve";

export function CartHeaderButton() {
  const [hasReservation, setHasReservation] = React.useState(false);

  React.useEffect(() => {
    getActiveReservationAction()
      .then((res) => {
        setHasReservation(res.hasReservation);
      })
      .catch(() => {});
  }, []);

  return (
    <Link href="/cart" aria-label="Корзина и бронь покупок">
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full border-linen-dark bg-alabaster hover:bg-linen text-espresso"
      >
        <ShoppingBag className="h-4 w-4" />
        {hasReservation && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white shadow-xs animate-pulse">
            1
          </span>
        )}
        <span className="sr-only">
          {hasReservation ? "Корзина (1 кукла в брони)" : "Корзина пуста"}
        </span>
      </Button>
    </Link>
  );
}
