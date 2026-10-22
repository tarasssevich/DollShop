import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Doll } from "@/types/domain";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "./ProductGrid";
import { Button } from "@/components/ui/button";

interface FeaturedSectionProps {
  dolls: Doll[];
  title?: string;
  subtitle?: string;
}

export function FeaturedSection({
  dolls,
  title = "Избранные произведения",
  subtitle = "Каждая кукла существует в единственном экземпляре (OOAK) и готова отправиться в новый дом.",
}: FeaturedSectionProps) {
  return (
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
              {title}
            </h2>
            <p className="text-sm text-muted leading-relaxed max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0">
            <Link href="/kukly">
              <Button
                variant="outline"
                className="rounded-full border-linen-dark bg-white hover:bg-linen group text-xs sm:text-sm"
              >
                <span>Все куклы в каталоге</span>
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Responsive Grid */}
        <ProductGrid dolls={dolls} />

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
  );
}
