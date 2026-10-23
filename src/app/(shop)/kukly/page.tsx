import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { getDolls } from "@/lib/data/catalog";
import { Sparkles, Truck, ShieldCheck, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Куклы-феи в наличии (Ручная работа) — DollShop",
  description:
    "Интерьерные куклы-феи и ангелы ручной работы в наличии. Натуральный хлопок макраме, резное дерево, фатин с ромашками, подарочная коробка и доставка Европочтой по Беларуси.",
};

export default async function DollsCatalogPage() {
  const dolls = await getDolls({ status: "available" });

  return (
    <div className="py-10 sm:py-16">
      <Container className="space-y-10 sm:space-y-12">
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-terracotta-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Каталог коллекции 2026</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso">
            Куклы-феи в наличии (Ищут дом)
          </h1>

          <p className="text-base text-muted leading-relaxed">
            Все феи и ангелы в этом разделе полностью готовы и ждут переезда
            в свой новый дом. Каждая кукла бережно укладывается в крафтовую
            подарочную коробочку с атласной лентой и паспортом изделия.
          </p>

          {/* Quick service banner */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted">
            <span className="flex items-center gap-1.5 font-medium text-espresso">
              <Truck className="h-4 w-4 text-terracotta" />
              Европочта по всей Беларуси (2–3 дня)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-espresso">
              <ShieldCheck className="h-4 w-4 text-sage" />
              Бронь 15 минут в корзине
            </span>
            <span className="flex items-center gap-1.5 font-medium text-espresso">
              <Heart className="h-4 w-4 text-terracotta" />
              Единственный экземпляр (OOAK)
            </span>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="border-t border-linen-dark pt-8">
          <ProductGrid
            dolls={dolls}
            emptyMessage="В данный момент все готовые куклы нашли свой дом. Вы можете оформить заказ на создание похожей работы."
          />
        </div>
      </Container>
    </div>
  );
}
