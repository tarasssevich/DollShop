"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Send, Phone, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/kukly", label: "Куклы в наличии", badge: "OOAK" },
  { href: "/na-zakaz", label: "На заказ" },
  { href: "/galereya", label: "Галерея работ" },
  { href: "/o-mastere", label: "О мастере и технике" },
  { href: "/styleguide", label: "Styleguide (Дизайн-система)" },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-espresso hover:bg-linen"
          aria-label="Открыть главное меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col justify-between overflow-y-auto bg-alabaster"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-3xl font-light text-espresso tracking-tight">
              DollShop
            </SheetTitle>
            <SheetDescription className="text-xs text-muted">
              Цифровой арт-бутик и галерея авторских кукол ручной работы
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {/* Navigation links */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-espresso transition-colors hover:bg-linen hover:text-terracotta active:scale-[0.99]"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-terracotta-subtle px-2 py-0.5 font-serif italic text-xs text-terracotta border border-terracotta/20">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <Separator />

          {/* Delivery banner */}
          <div className="rounded-xl border border-linen-dark bg-linen/60 p-4 space-y-1.5 text-xs text-muted leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-espresso">
              <Truck className="h-3.5 w-3.5 text-terracotta" />
              Доставка по Беларуси
            </p>
            <p>
              Европочтой до любого отделения за 2–3 дня в авторской защитной шкатулке.
            </p>
          </div>
        </div>

        {/* Bottom Contacts & Legal */}
        <div className="pt-6 space-y-4 border-t border-linen-dark mt-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Связь с мастером
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://t.me/dollshop_by"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-espresso hover:text-terracotta transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-linen flex items-center justify-center text-terracotta">
                  <Send className="h-4 w-4" />
                </div>
                <span>Telegram: @dollshop_by</span>
              </a>

              <a
                href="tel:+375291234567"
                className="flex items-center gap-2.5 text-sm text-espresso hover:text-terracotta transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-linen flex items-center justify-center text-sage">
                  <Phone className="h-4 w-4" />
                </div>
                <span>+375 (29) 123-45-67</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-light pt-2">
            <span>ИП Прокопенко А. В.</span>
            <span>Минск, Беларусь</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
