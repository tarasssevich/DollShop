import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Mail,
  ArrowRight,
  Palette,
  Scissors,
  CheckCircle2,
  Trees,
} from "lucide-react";

export const metadata: Metadata = {
  title: "О мастере и технике создания кукол — DollShop",
  description:
    "История мастерской интерьерных фей и ангелов ручной работы в Минске. Натуральный хлопок макраме, резное дерево, фатин с ромашками и мини-букетики.",
};

export default function AboutMasterPage() {
  return (
    <div className="py-10 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Page Header */}
      <Container className="space-y-6 max-w-4xl text-center">
        {/* Atelier Official Seal */}
        <div className="flex justify-center">
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden border-2 border-linen-dark/80 bg-white shadow-md p-1 transition-transform duration-500 hover:scale-105">
            <Image
              src="/images/logo-512.webp"
              alt="Официальная эмблема ателье авторских кукол"
              fill
              sizes="(max-width: 640px) 112px, 144px"
              className="object-cover rounded-full"
              priority
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-terracotta-subtle px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Мастерская интерьерных фей · Минск</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso leading-tight">
          «В каждой фее — тепло натуральных нитей, дерева и капелька сказки»
        </h1>

        <blockquote className="font-serif italic text-xl sm:text-2xl text-terracotta max-w-2xl mx-auto leading-relaxed">
          «Когда в руках соединяются мягкий хлопок, ароматное дерево и нежнейший
          фатин с ромашками — рождается маленькое чудо, согревающее дом.»
        </blockquote>

        <p className="text-base text-muted max-w-2xl mx-auto leading-relaxed">
          Добро пожаловать в мир текстильных кукол-фей, ангелов и добрых
          интерьерных оберегов ручной работы из Минска.
        </p>
      </Container>

      {/* 2. Visual Story Showcase */}
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden rounded-3xl border border-linen-dark bg-white p-3 shadow-lg">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-linen">
              <Image
                src="/mock/dolls/fairy-blue-1.jpg"
                alt="Кукла-фея ручной работы на натуральном льне"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 540px"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Путь мастера: от первых нитей макраме к любимым сказочным феям
            </h2>
            <p>
              Меня зовут Алёна. Все началось с желания создать для своего дома
              особенный, теплый декор — не пластиковый и бездушный, а живой,
              дышащий природой и уютом.
            </p>
            <p>
              Так родилась первая кукла-фея: с крылышками бабочки из светлого
              дерева, мягкими локонами из хлопковой пряжи и пышной юбочкой из
              фатина с вышитыми ромашками. С тех пор эти феи разлетелись по сотням
              домов Беларуси и других стран, принося в комнаты радость, тепло и
              умиротворение.
            </p>
            <p>
              Их дарят дочкам и мамам, вешают над колыбелью новорожденного как
              ангела-хранителя, украшают ими зеркала, рабочие места и новогодние
              елочки.
            </p>

            <div className="pt-2 flex items-center gap-6 text-espresso text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sage" />
                100% экологичные материалы
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-terracotta" />
                Ручная сборка каждой детали
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
              Материалы и компоненты
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
              Только натуральные и тактильные текстуры
            </h2>
            <p className="text-sm text-muted">
              Каждая кукла создана из приятных на ощупь, безопасных материалов,
              к которым хочется прикасаться снова и снова.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-terracotta-subtle text-terracotta flex items-center justify-center">
                <Trees className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Натуральное дерево
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Гладкая березовая бусина с ручной росписью личика и резные
                ажурные крылышки бабочки с филигранной лазерной гравировкой.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-sage-subtle text-sage flex items-center justify-center">
                <Scissors className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Хлопковая пряжа макраме
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Шелковистые локоны и витой корсаж из 100% натурального хлопка. Нити
                не электризуются и красиво струятся по плечам куколки.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-linen text-espresso flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Ромашковый фатин
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Воздушная многослойная юбочка из полупрозрачной вуали, украшенная
                вышитыми белыми ромашками с золотыми сердцевинками.
              </p>
            </div>

            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-terracotta-subtle text-terracotta flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Цветочный букетик
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                В ручках каждой феи заботливо закреплен миниатюрный букет
                лазурных незабудок, крымской лаванды или крошечных розочек.
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
                Паспорт изделия
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Красивая бирка-паспорт с именем феи, датой создания, рекомендациями
                по уходу и теплыми пожеланиями мастера.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sage-subtle text-sage flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl font-light text-espresso">
                Подарочная упаковка
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Каждая кукла бережно укладывается в крафтовую подарочную коробочку
                с бумажным наполнителем и атласной лентой. Готовый подарок!
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-linen text-espresso flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl font-light text-espresso">
                Почта или самовывоз
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Почтовые отправления по всей Беларуси (2–4 дня) с трек-номером либо
                бесплатный самовывоз в Минске по согласованию времени.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* 5. Bottom Navigation CTAs */}
      <Container className="text-center space-y-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
          Хотите поселить фею в своем доме?
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Выберите готовую куколку из наличия или закажите любимое цветовое
          сочетание.
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
              Заказать фею в своих цветах
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
