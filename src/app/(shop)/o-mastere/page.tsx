import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Flame,
  Heart,
  ShieldCheck,
  Truck,
  ArrowRight,
  Palette,
  Scissors,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "О мастере и технике создания кукол — DollShop",
  description:
    "История минской мастерской авторской фарфоровой куклы. Технологии лепки, высокотемпературный обжиг 1250°C, натуральный шёлк, мохер и принципы OOAK.",
};

export default function AboutMasterPage() {
  return (
    <div className="py-10 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Page Header */}
      <Container className="space-y-6 max-w-4xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-terracotta-subtle px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Мастерская авторской куклы · Минск</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso leading-tight">
          «Каждая кукла рождается с собственным именем и душой»
        </h1>

        <blockquote className="font-serif italic text-xl sm:text-2xl text-terracotta max-w-2xl mx-auto leading-relaxed">
          «Фарфор — удивительный материал. Он холодный и хрупкий в начале пути,
          но пройдя через пламя печи и тепло рук мастера, обретает дыхание вечности.»
        </blockquote>

        <p className="text-base text-muted max-w-2xl mx-auto leading-relaxed">
          Добро пожаловать в творческую лабораторию. Здесь соединяются
          академическая скульптура, старинные портновские техники и искренняя
          любовь к деталям.
        </p>
      </Container>

      {/* 2. Visual Story Showcase */}
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden rounded-3xl border border-linen-dark bg-white p-3 shadow-lg">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-linen">
              <Image
                src="/mock/artist/master-workshop.svg"
                alt="Мастерская за работой над фарфоровой куклой"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 540px"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Путь мастера: от академической глины к кукольному искусству
            </h2>
            <p>
              Меня зовут Алёна Прокопенко. Мой творческий путь начался более 8
              лет назад. Пройдя классическую школу академического рисунка и
              скульптуры, я однажды прикоснулась к искусству авторской шарнирной
              куклы — и поняла, что нашла свое истинное призвание.
            </p>
            <p>
              Кукла — это синтетическое искусство, где скульптор одновременно
              выступает анатомом, ювелиром, визажистом, обувщиком и историком
              костюма. Здесь нет места конвейеру: создание одного шедевра
              занимает от 3 до 5 недель непрерывного кропотливого труда.
            </p>
            <p>
              Сегодня мои работы живут в частных коллекциях в Беларуси, России,
              Германии, Франции и других странах. Но сердце мастерской неизменно
              бьется в тихом уголке старого Минска.
            </p>

            <div className="pt-2 flex items-center gap-6 text-espresso text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sage" />
                Член союза ремесленников
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-terracotta" />
                100% ручной труд
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* 3. Materials & Craft Pillars */}
      <section className="bg-linen/40 py-16 sm:py-24 border-y border-linen-dark">
        <Container className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-terracotta font-semibold">
              Материалы и технологии
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Благородные компоненты долговечности
            </h2>
            <p className="text-sm text-muted">
              Для создания кукол используются только натуральные премиальные
              материалы музейного уровня.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-terracotta-subtle text-terracotta flex items-center justify-center">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Бисквитный фарфор
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Французская фарфоровая масса Flashe. Обжигается при температуре
                1250°C. Поверхность бархатистая на ощупь, имитирующая нежную
                человеческую кожу.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-sage-subtle text-sage flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Надглазурная роспись
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Пигменты впекаются в фарфор при температуре 780°C. Роспись не
                стирается, не выцветает от солнечного света и сохраняет свежесть
                десятилетиями.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-linen text-espresso flex items-center justify-center">
                <Scissors className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Шелк и кружево
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Наряды шьются из натурального шелка ручного крашения корой дуба и
                ягодами, антикварного кружева XIX века и батиста с ручной
                вышивкой бисером.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-terracotta-subtle text-terracotta flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                14 шарниров и замша
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Шарнирные соединения проклеены тончайшей натуральной замшей для
                мягкого скольжения и надежной фиксации грациозных живых поз.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Packaging, Certificate & Delivery */}
      <Container>
        <div className="rounded-3xl border border-linen-dark bg-white p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-terracotta-subtle text-terracotta flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl font-light text-espresso">
                Паспорт подлинности
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                К каждому произведению прилагается сертификат с уникальным
                номером, названием коллекции, датой рождения куклы и личной
                подписью автора.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sage-subtle text-sage flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl font-light text-espresso">
                Авторская шкатулка
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Кукла упаковывается в деревянный коллекционный бокс с мягким
                бархатным ложементом и шелковыми лентами, надежно защищающими
                фарфор в пути.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-linen text-espresso flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl font-light text-espresso">
                Европочта по Беларуси
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Бережная экспресс-доставка до любого отделения Европочты за 2–3
                дня с трек-номером и возможностью проверки целостности при
                получении.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* 5. Bottom Navigation CTAs */}
      <Container className="text-center space-y-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
          Готовы познакомиться с куклами ближе?
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Посмотрите работы в наличии или закажите создание куклы с вашим
          характером.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/kukly">
            <Button size="lg" className="rounded-full shadow-xs px-8">
              <span>Смотреть кукол в наличии</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>

          <Link href="/na-zakaz">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-linen-dark bg-white hover:bg-linen px-8"
            >
              Заказать куклу у мастера
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
