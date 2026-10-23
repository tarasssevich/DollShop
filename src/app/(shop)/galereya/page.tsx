import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { GalleryGrid } from "@/components/shop/GalleryGrid";
import { getDolls } from "@/lib/data/catalog";
import { Sparkles, Archive, Heart, MapPin, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Галерея частных коллекций (Архив фей) | DollShop",
  description:
    "Арт-портфолио авторских интерьерных фей и ангелов ручной работы, обретающих дом в семьях Беларуси и мира. Вдохновение и возможность заказать похожую куклу у мастера.",
};

export default async function GalleryArchivePage() {
  const soldDolls = await getDolls({ status: "sold" });

  return (
    <div className="py-10 sm:py-16 bg-alabaster">
      <Container className="space-y-12 sm:space-y-16">
        {/* Editorial Header */}
        <div className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-linen-dark bg-linen px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
              <Archive className="h-3.5 w-3.5 text-terracotta" />
              <span>Арт-портфолио · Нашли дом</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso">
              Галерея частных коллекций
            </h1>

            <p className="text-base text-muted leading-relaxed">
              Каждая фея создается вручную в единственном экземпляре (OOAK).
              В этой галерее бережно собраны работы, которые уже живут в домах
              своих ценителей и дарят тепло, уют и сказку.
            </p>
          </div>

          {/* Key Archive Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-linen-dark bg-white/70 p-4 space-y-1">
              <span className="font-serif text-2xl font-normal text-terracotta block">
                140+ работ
              </span>
              <p className="text-xs text-muted">
                созданы вручную мастером за годы творчества
              </p>
            </div>

            <div className="rounded-xl border border-linen-dark bg-white/70 p-4 space-y-1">
              <span className="font-serif text-2xl font-normal text-sage block flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Беларусь
              </span>
              <p className="text-xs text-muted">
                Минск, Гродно, Брест, Витебск, Гомель и Могилев
              </p>
            </div>

            <div className="rounded-xl border border-linen-dark bg-white/70 p-4 space-y-1">
              <span className="font-serif text-2xl font-normal text-espresso block flex items-center gap-1.5">
                <Feather className="h-4 w-4 text-terracotta" />
                100% OOAK
              </span>
              <p className="text-xs text-muted">
                без повторов: у каждой работы свой неповторимый характер
              </p>
            </div>
          </div>
        </div>

        {/* Editorial Masonry Gallery */}
        <div className="border-t border-linen-dark pt-8">
          <GalleryGrid
            dolls={soldDolls}
            emptyMessage="В архиве галереи пока нет работ"
          />
        </div>

        {/* Custom Order Callout Banner */}
        <div className="rounded-3xl border border-linen-dark bg-gradient-to-b from-white to-linen/40 p-8 sm:p-14 text-center space-y-5 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-terracotta-subtle text-terracotta mx-auto flex items-center justify-center shadow-xs">
            <Heart className="h-7 w-7" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-muted font-semibold">
              Индивидуальный заказ
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Понравился образ из архива?
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Точный повтор невозможен — каждая работа уникальна. Но мастер с радостью
              создаст для вас новую фею в похожей цветовой палитре, образе и настроении.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-sm text-sm px-7">
              <Link href="/na-zakaz">
                <Sparkles className="h-4 w-4 mr-2" />
                Заказать куклу по мотивам архива
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="rounded-full text-sm">
              <Link href="/kukly">
                Смотреть работы в наличии
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
