import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Doll } from "@/types/domain";
import { formatPrice } from "@/lib/utils/format";

interface HeroProps {
  featuredDoll?: Doll | null;
}

export function Hero({ featuredDoll }: HeroProps) {
  const doll = featuredDoll ?? null;
  const coverImage = doll?.images[0];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-alabaster via-linen/40 to-alabaster py-8 sm:py-16 lg:py-24">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-terracotta/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-24 -z-10 h-[400px] w-[400px] rounded-full bg-sage/5 blur-3xl"
        aria-hidden="true"
      />

      <Container>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Left Column: Text & Story Manifesto */}
          <div className="flex flex-col space-y-6 text-center lg:col-span-7 lg:space-y-8 lg:text-left">
            {/* Top pill badge */}
            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-terracotta-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                <span>Галерея авторских кукол · Минск</span>
              </span>
            </div>

            {/* Main Headline (Cormorant Garamond) */}
            <h1 className="font-serif text-3xl font-light tracking-tight text-espresso sm:text-5xl lg:text-6xl xl:text-[64px] xl:leading-[1.12]">
              Художественные коллекционные куклы{" "}
              <span className="italic text-terracotta">в единственном</span>{" "}
              экземпляре
            </h1>

            {/* Story manifesto quote */}
            <blockquote className="border-l-0 pl-0 font-serif italic text-lg leading-relaxed text-espresso-soft sm:border-l-2 sm:border-terracotta/60 sm:pl-4 sm:text-xl lg:text-2xl">
              «В каждой кукле нет фабричной симметрии — лишь живое дыхание
              ручного искусства, бисквитный фарфор и антикварный шёлк.»
            </blockquote>

            {/* Short subtitle description */}
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted sm:text-base lg:mx-0">
              Каждое создание рождается вручную в минской мастерской: 14 подвижных
              шарниров, надглазурная роспись, авторская шкатулка и персональный
              паспорт подлинности.
            </p>

            {/* Mobile-first CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link href="/kukly" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full rounded-full px-8 shadow-md hover:shadow-lg active:scale-[0.98] sm:w-auto"
                >
                  <span>Смотреть работы в наличии</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>

              <Link href="/na-zakaz" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-linen-dark bg-white/90 px-7 hover:bg-linen active:scale-[0.98] sm:w-auto"
                >
                  Кукла на заказ
                </Button>
              </Link>
            </div>

            {/* Micro Trust Indicators (Belarus E-commerce) */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-linen-dark/80 text-xs text-muted sm:grid-cols-3 sm:gap-4">
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <Heart className="h-4 w-4 shrink-0 text-terracotta" />
                <span>Только 1 из 1 (OOAK)</span>
              </div>
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <Truck className="h-4 w-4 shrink-0 text-sage" />
                <span>Европочта по всей РБ</span>
              </div>
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <ShieldCheck className="h-4 w-4 shrink-0 text-terracotta" />
                <span>Резерв 15 минут в корзине</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Card (Flagship Doll) */}
          <div className="lg:col-span-5">
            <div className="group relative mx-auto max-w-md lg:max-w-none">
              {/* Soft ambient back glow behind doll photo frame */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-terracotta/20 via-linen to-sage/20 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100" />

              {/* Card Container */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-linen-dark bg-white p-3 shadow-lg transition-transform duration-300 group-hover:shadow-xl sm:p-4">
                {/* Image Frame */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-linen sm:rounded-2xl">
                  {coverImage ? (
                    <Image
                      src={coverImage.url}
                      alt={coverImage.alt || (doll?.name ?? "Авторская кукла")}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif italic text-muted">
                      Фото куклы
                    </div>
                  )}

                  {/* Gradient overlay at bottom of photo for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-black/10 pointer-events-none" />

                  {/* Status Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge variant="available" className="shadow-xs backdrop-blur-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      В наличии
                    </Badge>
                    <Badge variant="ooak" className="shadow-xs bg-white/95 backdrop-blur-xs">
                      OOAK
                    </Badge>
                  </div>

                  {/* Floating Price Tag */}
                  {doll ? (
                    <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 font-sans text-xs font-semibold text-terracotta shadow-xs backdrop-blur-xs">
                      {formatPrice(doll.priceByn)}
                    </div>
                  ) : null}

                  {/* Floating Mini Details Panel */}
                  {doll ? (
                    <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/40 bg-white/95 p-3.5 shadow-md backdrop-blur-md transition-all sm:p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <p className="font-serif text-lg font-medium tracking-tight text-espresso sm:text-xl">
                            «{doll.name}»
                          </p>
                          <p className="text-xs text-muted">
                            {doll.heightCm} см · {doll.materials[0] ?? "Фарфор"}
                          </p>
                        </div>

                        <Link
                          href={`/kukly/${doll.slug}`}
                          className="flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
                        >
                          <span>Подробнее</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
