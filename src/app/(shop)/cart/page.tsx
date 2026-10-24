import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { getDolls } from "@/lib/data/catalog";
import { getActiveReservationsAction } from "@/actions/reserve";
import { getMySavedOrdersAction } from "@/actions/order";
import { CartReservationView } from "@/components/cart/CartReservationView";
import { MyOrdersList } from "@/components/cart/MyOrdersList";

export const metadata: Metadata = {
  title: "Корзина и заказы | DollShop",
  description:
    "Ваша корзина, забронированные авторские куклы и оформленные заказы. Отслеживание доставки Белпочтой.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const reservations = await getActiveReservationsAction();
  const myOrders = await getMySavedOrdersAction();
  const hasReservation = reservations.length > 0;
  const availableDolls = await getDolls({ status: "available", limit: 3 });

  return (
    <div className="py-8 sm:py-12 bg-alabaster min-h-[70vh]">
      <Container className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta mb-2 border border-terracotta/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ателье авторских кукол · Единственный экземпляр</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
            {hasReservation
              ? reservations.length > 1
                ? `Ваша бронь · ${reservations.length}`
                : "Ваша бронь"
              : "Корзина и заказы"}
          </h1>
          <p className="text-sm text-muted mt-1 max-w-xl">
            {hasReservation
              ? "Выбранные авторские работы удерживаются за вами по 15 минут каждая. Оформите заказ на каждую куклу отдельно."
              : "Здесь вы можете отслеживать оформленные заказы, их доставку или забронировать понравившуюся куклу из каталога."}
          </p>
        </div>

        {/* Content */}
        {hasReservation ? (
          <div className="space-y-10">
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <CartReservationView
                  key={reservation.productId}
                  reservation={reservation}
                />
              ))}
            </div>

            <div className="pt-6 border-t border-linen-dark">
              <MyOrdersList
                initialOrders={myOrders}
                title="Ваши оформленные заказы"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Раздел оформленных заказов (если есть) или поиск по номеру телефона */}
            <MyOrdersList initialOrders={myOrders} />

            {/* Empty State Card для активной брони */}
            <div className="rounded-3xl border border-linen-dark bg-white p-8 sm:p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linen border border-linen-dark text-muted mb-5">
                <ShoppingBag className="h-8 w-8 text-terracotta/80" />
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-espresso mb-3">
                В вашей корзине пока пусто
              </h2>

              <p className="text-sm text-muted max-w-md mx-auto leading-relaxed mb-8">
                В нашем магазине все куклы создаются вручную в единственном экземпляре (OOAK). Когда вы нажимаете кнопку <strong>«Бронь»</strong>, кукла резервируется на 15 минут, чтобы вы могли спокойно оформить доставку почтой или самовывоз.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" variant="default" className="rounded-full px-8 shadow-xs">
                  <Link href="/kukly">
                    <span>Выбрать куклу в каталоге</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <Link href="/na-zakaz">
                    <Sparkles className="h-4 w-4 mr-2 text-terracotta" />
                    <span>Заказать индивидуально</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Recommendations: Available dolls right now */}
            {availableDolls.filter((d) => d.images && d.images.length > 0 && d.images[0]?.url).length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-light text-espresso">
                      Куклы в наличии прямо сейчас
                    </h3>
                    <p className="text-xs text-muted">
                      Готовы к быстрой отправке почтой или самовывозу в Минске
                    </p>
                  </div>
                  <Button asChild variant="link" className="text-terracotta text-xs">
                    <Link href="/kukly">
                      Все в наличии ({availableDolls.filter((d) => d.images && d.images.length > 0 && d.images[0]?.url).length}) →
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableDolls
                    .filter((d) => d.images && d.images.length > 0 && d.images[0]?.url)
                    .map((doll) => (
                      <ProductCard key={doll.id} doll={doll} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
