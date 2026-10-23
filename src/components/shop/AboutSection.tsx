import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Flame } from "lucide-react";
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
              {/* Soft ambient back glow */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-terracotta/15 via-linen to-sage/15 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100" />

              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-linen-dark bg-white p-3 shadow-md sm:p-4">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-linen sm:rounded-2xl">
                  <Image
                    src="/mock/artist/master-workshop.svg"
                    alt="Мастерская авторской фарфоровой куклы в Минске"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent pointer-events-none" />

                  {/* Floating studio badge */}
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/50 bg-white/95 p-3 shadow-sm backdrop-blur-md">
                    <p className="font-serif italic text-sm text-espresso">
                      «Фарфор требует абсолютной честности — он помнит каждое
                      прикосновение рук.»
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      Минская студия художественной куклы
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
              В фарфоре оживает то, что невозможно передать словами
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-muted leading-relaxed">
              <p>
                Более 8 лет в уютной мастерской в Минске рождаются шарнирные и
                статичные коллекционные куклы из благородного бисквитного
                фарфора. Каждое произведение создается без форм и фабричных
                отливок — только ручная лепка, многократный обжиг и тончайшая
                роспись.
              </p>
              <p>
                В нарядах используются винтажные ткани, антикварный шелк и кружева
                ручного плетения, а локоны создаются из нежнейшего мохера
                тибетской козочки. Каждая кукла обладает своим паспортом подлинности
                и отправляется в деревянной шкатулке.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 border-y border-linen-dark py-6">
              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-terracotta">
                  140+
                </p>
                <p className="text-xs text-muted">
                  кукол в частных коллекциях
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-sage flex items-center justify-center lg:justify-start gap-1">
                  <Flame className="h-5 w-5 sm:h-7 sm:w-7 text-sage" />
                  1250°
                </p>
                <p className="text-xs text-muted">температура обжига фарфора</p>
              </div>

              <div className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl font-light text-espresso flex items-center justify-center lg:justify-start gap-1">
                  <Heart className="h-5 w-5 sm:h-7 sm:w-7 text-terracotta" />
                  100%
                </p>
                <p className="text-xs text-muted">ручной труд (только OOAK)</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="/o-mastere" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full w-full sm:w-auto shadow-xs">
                  <span>Читать историю создания кукол</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>

              <Link href="/na-zakaz" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-linen-dark bg-white hover:bg-linen w-full sm:w-auto"
                >
                  Заказать свою куклу
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
