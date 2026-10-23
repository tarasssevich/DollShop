import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { getDolls } from "@/lib/data/catalog";
import { Sparkles, Archive, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Галерея проданных фей (Архив) — DollShop",
  description:
    "Галерея авторских интерьерных фей ручной работы, находящихся в частных коллекциях. Вдохновение и возможность заказать похожую куклу у мастера.",
};

export default async function GalleryArchivePage() {
  const soldDolls = await getDolls({ status: "sold" });

  return (
    <div className="py-10 sm:py-16">
      <Container className="space-y-10 sm:space-y-12">
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-linen-dark bg-linen px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Archive className="h-3.5 w-3.5" />
            <span>Архив работ</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso">
            Галерея частных коллекций
          </h1>

          <p className="text-base text-muted leading-relaxed">
            Интерьерные феи и ангелы, нашедшие свой дом в частных коллекциях.
            Каждая кукла неповторима, но вы можете заказать создание новой работы
            в похожих тонах и образе.
          </p>
        </div>

        {/* Catalog Grid */}
        <div className="border-t border-linen-dark pt-8">
          <ProductGrid
            dolls={soldDolls}
            emptyMessage="В архиве пока нет работ"
          />
        </div>

        {/* Custom Order Callout */}
        <div className="rounded-2xl border border-linen-dark bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="h-12 w-12 rounded-full bg-terracotta-subtle text-terracotta mx-auto flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl font-light text-espresso">
            Понравился образ из архива?
          </h2>
          <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Точный повтор невозможен — каждая кукла уникальна. Однако мастер
            может создать новое произведение в той же стилистике и цветовой гамме.
          </p>
          <div className="pt-2">
            <Link href="/na-zakaz">
              <Button size="lg" className="rounded-full shadow-xs">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Заказать куклу по мотивам архива
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
