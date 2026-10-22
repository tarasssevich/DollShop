import { Hero } from "@/components/shop/Hero";
import { CatalogTabs } from "@/components/shop/CatalogTabs";
import { getDollBySlug, getDolls } from "@/lib/data/catalog";
import { Container } from "@/components/layout/Container";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Heart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [featuredDoll, availableDolls, inProgressDolls, soldDolls] =
    await Promise.all([
      getDollBySlug("selesta"),
      getDolls({ status: "available" }),
      getDolls({ status: "in_progress" }),
      getDolls({ status: "sold" }),
    ]);

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Atmospheric Hero Section (Step 2.1) */}
      <Hero featuredDoll={featuredDoll} />

      {/* 2. Interactive Catalog Tabs Section (Step 2.3) */}
      <section className="py-12 sm:py-20 bg-alabaster">
        <Container className="space-y-10 sm:space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-linen-dark pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-terracotta font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Коллекция мастера</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-espresso">
                Произведения в галерее
              </h2>
              <p className="text-sm text-muted leading-relaxed max-w-xl">
                Выберите категорию: готовые куклы в наличии, работы на стадии
                создания или архив шедевров в частных собраниях.
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/kukly">
                <Button
                  variant="outline"
                  className="rounded-full border-linen-dark bg-white hover:bg-linen group text-xs sm:text-sm"
                >
                  <span>Все куклы в наличии</span>
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Instant Client Tabs Component */}
          <CatalogTabs
            availableDolls={availableDolls}
            inProgressDolls={inProgressDolls}
            soldDolls={soldDolls}
          />

          {/* Bottom Banner for Custom Orders */}
          <div className="rounded-2xl border border-linen-dark bg-gradient-to-r from-linen/80 via-white to-linen/80 p-6 sm:p-10 text-center space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
              Не нашли куклу своей мечты?
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
              Мастер может создать уникальное произведение по вашим пожеланиям:
              выберите цвет глаз, материал волос, роспись и исторический наряд.
            </p>
            <div className="pt-2">
              <Link href="/na-zakaz">
                <Button variant="default" size="lg" className="rounded-full shadow-xs">
                  Узнать об индивидуальном заказе
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Boutique Values / Philosophy Section */}
      <section className="border-t border-linen-dark bg-white py-12 sm:py-16">
        <Container className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-muted font-semibold">
              Ценности мастерской
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Искусство создания куклы
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Мы создаем не игрушки, а коллекционные скульптурные произведения с
              живым характером для ценителей прекрасного.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-linen-dark bg-alabaster/60 p-6 space-y-3 transition-colors hover:border-terracotta/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-subtle text-terracotta">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Единственный экземпляр
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Каждая кукла уникальна. Формы, роспись лица и наряды создаются в
                единственном числе (OOAK). Повторы исключены.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-alabaster/60 p-6 space-y-3 transition-colors hover:border-sage/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-subtle text-sage">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Благородные материалы
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Французский бисквитный фарфор, натуральный шёлк ручного окрашивания,
                старинное кружево и мохер тибетской козочки.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-alabaster/60 p-6 space-y-3 transition-colors hover:border-terracotta/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linen text-espresso">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Паспорт и шкатулка
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Каждая работа бережно упаковывается в деревянную шкатулку с бархатным
                ложементом. Прилагается авторский паспорт подлинности.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Delivery banner & Styleguide Link */}
      <section className="border-t border-linen-dark bg-linen/30 py-8">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-terracotta-subtle flex items-center justify-center text-terracotta">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-espresso">
                Доставка Европочтой по всей Беларуси
              </p>
              <p className="text-[11px] text-muted">
                Срок доставки 2–3 дня с трек-номером и бережной упаковкой
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/styleguide">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Посмотреть Styleguide
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
