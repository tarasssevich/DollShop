"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Send, Phone, Mail } from "lucide-react";
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
  { href: "/cart", label: "Корзина / Моя бронь" },
  { href: "/moi-zakazy", label: "Мои заказы и трекинг 📦" },
  { href: "/kukly", label: "Куклы в наличии", badge: "OOAK" },
  { href: "/na-zakaz", label: "На заказ" },
  { href: "/galereya", label: "Галерея работ" },
  { href: "/o-mastere", label: "О мастере и технике" },
  { href: "/demo", label: "Тест-центр фичей ⚡", badge: "Demo" },
  { href: "/styleguide", label: "Styleguide (Дизайн-система)" },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

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
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border border-linen-dark/80 bg-white shadow-2xs">
                <Image
                  src="/images/logo-128.webp"
                  alt="Логотип DollShop — Ателье авторских кукол"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="font-serif text-2xl font-light text-espresso tracking-tight">
                  DollShop
                </SheetTitle>
                <SheetDescription className="text-xs text-muted">
                  Ателье авторских кукол
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator />

          {/* Navigation links with Active State */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    isActive
                      ? "bg-terracotta/10 text-terracotta font-semibold border border-terracotta/25 shadow-2xs"
                      : "text-espresso hover:bg-linen hover:text-terracotta"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-terracotta shrink-0 animate-pulse" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-serif italic text-xs border ${
                        isActive
                          ? "bg-terracotta text-white border-terracotta shadow-xs"
                          : "bg-terracotta-subtle text-terracotta border-terracotta/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Fulfillment banner */}
          <div className="rounded-xl border border-linen-dark bg-linen/60 p-4 space-y-1.5 text-xs text-muted leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-espresso">
              <Mail className="h-3.5 w-3.5 text-terracotta" />
              Почта или самовывоз
            </p>
            <p>
              Посылка с трек-номером по Беларуси или бесплатный самовывоз в Минске в авторской защитной шкатулке.
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
