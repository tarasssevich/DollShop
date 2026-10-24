import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Package, ArrowLeft, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { getMySavedOrdersAction } from "@/actions/order";
import { MyOrdersList } from "@/components/cart/MyOrdersList";

export const metadata: Metadata = {
  title: "Мои заказы | DollShop",
  description:
    "Просмотр оформленных заказов, статус готовности и трек-номера посылок Белпочты в ателье авторских кукол DollShop.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const myOrders = await getMySavedOrdersAction();

  return (
    <div className="py-8 sm:py-12 bg-alabaster min-h-[75vh]">
      <Container className="max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2 text-muted hover:text-espresso">
            <Link href="/kukly">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Вернуться в каталог
            </Link>
          </Button>

          <div className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
            <span>Ателье DollShop · Минск</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta border border-terracotta/20">
            <Package className="h-3.5 w-3.5" />
            <span>Личный кабинет без паролей · Доступ в 1 клик</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
            Мои заказы
          </h1>
          <p className="text-sm text-muted max-w-xl leading-relaxed">
            Здесь вы можете отслеживать статус вашей куклы, просмотреть квитанцию и получить трек-номер отправления Белпочты.
          </p>
        </div>

        {/* Orders list or Phone lookup */}
        <MyOrdersList initialOrders={myOrders} />
      </Container>
    </div>
  );
}
