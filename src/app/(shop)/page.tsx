import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Heart, Truck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="py-12 sm:py-20">
      <Container className="space-y-16">
        {/* Hero Section Preview */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-terracotta-subtle px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta border border-terracotta/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Фаза 1 · Шаг 1.4 готов (Каркас сайта)</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-light tracking-tight text-espresso leading-tight">
            Авторские коллекционные куклы ручной работы
          </h1>

          <p className="font-serif italic text-xl sm:text-2xl text-terracotta max-w-xl mx-auto">
            «Каждое создание — единственный в мире экземпляр с собственной душой и историей.»
          </p>

          <p className="text-base text-muted max-w-xl mx-auto leading-relaxed">
            Бутик художественных шарнирных и статичных кукол из бисквитного фарфора.
            Тончайшая ручная роспись, антикварные ткани, натуральный мохер.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/styleguide">
              <Button size="lg" className="rounded-full">
                Витрина дизайн-системы (Styleguide)
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>

            <Link href="/styleguide#components">
              <Button variant="outline" size="lg" className="rounded-full">
                Интерактивные компоненты
              </Button>
            </Link>
          </div>
        </section>

        {/* Brand Highlights */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-6 border-t border-linen-dark">
          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-subtle text-terracotta">
                <Heart className="h-5 w-5" />
              </span>
              <Badge variant="ooak">1 of 1</Badge>
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Только OOAK
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              One Of A Kind — ни одного точного повтора. У каждой куклы персональный
              паспорт с подписью мастера и серийным номером.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-subtle text-sage">
                <Truck className="h-5 w-5" />
              </span>
              <Badge variant="secondary">Беларусь</Badge>
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Доставка Европочтой
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Надежная доставка в любое отделение по РБ за 2–3 дня. Каждая работа
              упакована в твердую деревянную шкатулку с мягким ложементом.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linen text-espresso">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <Badge variant="outline">Указ № 60</Badge>
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Официально в РБ
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ИП Прокопенко А. В., регистрация в Торговом реестре РБ, соблюдение
              Закона «О защите прав потребителей» и Закона № 99-З о персональных данных.
            </p>
          </div>
        </section>
      </Container>
    </div>
  );
}
