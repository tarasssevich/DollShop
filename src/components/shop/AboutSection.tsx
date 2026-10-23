import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Trees } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export function AboutSection() {
  return (
    <section className="border-t border-linen-dark bg-white py-12 sm:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Workshop Artwork Image */}
          <div className="lg:col-span-5">
            <div className="group relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-terracotta/15 via-linen to-sage/15 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100" />

              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-linen-dark bg-white p-3 shadow-md sm:p-4">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-linen sm:rounded-2xl">
                  <Image
                    src="/mock/artist/master-workshop.svg"
                    alt="Мастерская авторских текстильных кукол в Минске"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/50 bg-white/95 p-3 shadow-sm backdrop-blur-md">
                    <p className="font-serif italic text-sm text-espresso">
                      «Тепло натуральных нитей и дерева создает атмосферу сказки
                      в доме.»
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      Минская мастерская текстильных кукол
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Metrics */}
          <div className="flex flex-col space-y-6 text-center lg:col-span-7 lg:space-y-8 lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-terracotta-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta">
                <Sparkles className="h-3.5 w-3.5" />
                <span>О мастере и мастерской</span>
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-espresso leading-[1.18]">
              В хлопковых нитях и дереве рождается тепло уюта
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-muted leading-relaxed">
              <p>
                Более 5 лет в минской мастерской рождаются интерьерные
                куклы-феи, ангелы и цветочные обереги. Каждое создание собирается
                вручную из натуральной хлопковой пряжи макраме, точёного дерева,
                нежного ромашкового фатина и миниатюрных букетиков.
              </p>
              <p>
                Они не пылятся в шкафах — их с радостью вешают над кроваткой
                малыша, на зеркало или полочку в спальне, дарят на крестины,
                дни рождения и новоселья как символ заботы, света и душевного
                спокойствия.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 border-y border-linen-dark py-6">
              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-terracotta">
                  350+
                </p>
                <p className="text-xs text-muted">
                  фей нашли свой дом
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-sage flex items-center justify-center lg:justify-start gap-1">
                  <Trees className="h-5 w-5 sm:h-7 sm:w-7 text-sage" />
                  100%
                </p>
                <p className="text-xs text-muted">хлопок, фатин и дерево</p>
              </div>

              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-espresso flex items-center justify-center lg:justify-start gap-1">
                  <Heart className="h-5 w-5 sm:h-7 sm:w-7 text-terracotta" />
                  Ручная
                </p>
                <p className="text-xs text-muted">авторская работа</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="/o-mastere" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full w-full sm:w-auto shadow-xs">
                  <span>Читать историю мастера</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>

              <Link href="/na-zakaz" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-linen-dark bg-white hover:bg-linen w-full sm:w-auto"
                >
                  Заказать свою фею
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
