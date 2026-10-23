import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import {
  Clock,
  Sparkles,
  ArrowLeft,
  Package,
  ShieldCheck,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { getDollBySlug } from "@/lib/data/catalog";
import { db } from "@/db/client";
import { reservations } from "@/db/schema";
import {
  getReservationCookieName,
  hashReservationToken,
} from "@/lib/reservation/token";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { CheckoutReservationBar } from "@/components/checkout/CheckoutReservationBar";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doll = await getDollBySlug(slug);

  if (!doll) {
    return {
      title: "Кукла не найдена | DollShop",
    };
  }

  return {
    title: `Оформление заказа · ${doll.name} | DollShop`,
    description: `Оформление покупки авторской куклы «${doll.name}». Почта по Беларуси или самовывоз в Минске.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const doll = await getDollBySlug(slug);

  if (!doll) {
    notFound();
  }

  // Проверяем наличие валидной cookie брони и активную запись в PostgreSQL
  const cookieStore = await cookies();
  const cookieName = getReservationCookieName(doll.id);
  const rawToken = cookieStore.get(cookieName)?.value;

  let isReservedByCurrentSession = false;
  let reservedUntilIso = "";

  if (rawToken) {
    const tokenHash = hashReservationToken(rawToken);
    const [resRow] = await db
      .select({ expiresAt: reservations.expiresAt })
      .from(reservations)
      .where(
        and(
          eq(reservations.productId, doll.id),
          eq(reservations.tokenHash, tokenHash),
          gt(reservations.expiresAt, new Date())
        )
      );

    if (resRow) {
      isReservedByCurrentSession = true;
      reservedUntilIso = resRow.expiresAt.toISOString();
    }
  }

  // Сценарий 1: У пользователя нет активной брони на эту куклу (истекла, снята или кукла открыта напрямую)
  if (!isReservedByCurrentSession) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-linen-dark bg-white p-6 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 mb-5">
            <Clock className="h-7 w-7" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-espresso mb-3">
            Время бронирования истекло
          </h1>

          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed mb-8">
            Каждая кукла в нашей мастерской создается вручную в единственном экземпляре, поэтому бронь удерживается 15 минут. Если вы не успели завершить оформление, кукла вернулась в каталог.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
              <Link href={`/kukly/${doll.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к кукле «{doll.name}»
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href={`/na-zakaz?from=${doll.slug}`}>
                <Sparkles className="h-4 w-4 mr-2 text-terracotta" />
                Заказать похожую фею
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Сценарий 2: Активная подтвержденная бронь в БД (Step 5.1)
  const coverImage = doll.images[0]?.url || "/mock/dolls/fairy-blue-1.jpg";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10 space-y-6">
      {/* 1. Индикатор активной брони и обратный отсчет (Step 5.1) */}
      <CheckoutReservationBar
        productId={doll.id}
        slug={doll.slug}
        dollName={doll.name}
        reservedUntil={reservedUntilIso}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Левая колонка: Сводка заказа и забронированная кукла */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="font-serif text-xl font-medium text-espresso mb-4 flex items-center justify-between">
              <span>Забронированная работа</span>
              <span className="text-xs font-sans font-normal text-sage-dark bg-sage-subtle px-2.5 py-0.5 rounded-full border border-sage/20">
                Зафиксировано за вами
              </span>
            </h2>

            <div className="flex gap-4 sm:gap-5 pb-5 border-b border-linen-dark">
              <div className="relative h-28 w-24 sm:h-32 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-linen-dark bg-alabaster">
                <Image
                  src={coverImage}
                  alt={doll.name}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs text-muted uppercase tracking-wider font-medium">
                  {doll.collection}
                </p>
                <h3 className="font-serif text-lg font-medium text-espresso leading-snug truncate">
                  {doll.name}
                </h3>
                <p className="text-xs text-muted">
                  Рост: {doll.heightCm} см · Ручная работа
                </p>

                <div className="pt-1">
                  <span className="font-sans text-xl font-semibold text-terracotta">
                    {formatPrice(doll.priceByn)}
                  </span>
                </div>
              </div>
            </div>

            {/* Комплектация */}
            <div className="pt-4 space-y-2 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-terracotta shrink-0" />
                <span>Фирменная крафтовая коробка с атласной лентой</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                <span>Именной паспорт-сертификат с подписью мастера</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sage shrink-0" />
                <span>Бережная упаковка с пузырьковой защитой для пересылки</span>
              </div>
            </div>
          </div>

          {/* Интерактивная форма оформления заказа (Step 5.2) */}
          <CheckoutForm
            productId={doll.id}
            slug={doll.slug}
            dollName={doll.name}
            dollPriceByn={doll.priceByn}
          />
        </div>

        {/* Правая колонка: Итоговая стоимость и связь с мастером */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-medium text-espresso border-b border-linen-dark pb-3">
              Итого к оплате
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Кукла ручной работы:</span>
                <span className="text-espresso font-medium">
                  {formatPrice(doll.priceByn)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Подарочная упаковка:</span>
                <span className="text-sage-dark font-medium">Бесплатно</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Получение:</span>
                <span className="text-espresso">Почта или самовывоз</span>
              </div>
            </div>

            <div className="border-t border-linen-dark pt-3 flex justify-between items-baseline">
              <span className="font-medium text-espresso text-base">Итого:</span>
              <span className="font-sans text-2xl font-semibold text-terracotta">
                {formatPrice(doll.priceByn)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-alabaster/70 p-5 space-y-3 text-xs text-muted">
            <div className="flex items-center gap-2 text-espresso font-medium">
              <Phone className="h-4 w-4 text-terracotta" />
              <span>Вопросы по кукле или получению?</span>
            </div>
            <p className="leading-relaxed">
              Мастер на связи в Telegram и Viber. Если вам нужно изменить адрес или уточнить дату отправки, вы всегда можете написать нам напрямую.
            </p>
            <div className="pt-1 flex gap-2">
              <a
                href="https://t.me/dollshop_by"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-linen-dark hover:border-terracotta text-espresso hover:text-terracotta transition-colors"
              >
                Telegram мастера
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
