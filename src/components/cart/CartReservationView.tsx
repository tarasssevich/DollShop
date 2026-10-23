"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ArrowRight,
  Trash2,
  ShieldCheck,
  Package,
  Truck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/format";
import { releaseReservationAction, checkReservationStatusAction } from "@/actions/reserve";
import { notifyCartChanged } from "@/lib/reservation/events";
import type { ActiveUserReservationResult } from "@/actions/reserve";

interface CartReservationViewProps {
  reservation: Extract<ActiveUserReservationResult, { hasReservation: true }>;
}

export function CartReservationView({ reservation }: CartReservationViewProps) {
  const router = useRouter();
  const [isReleasing, startReleaseTransition] = React.useTransition();

  const [timeLeftMs, setTimeLeftMs] = React.useState<number>(() => {
    const end = new Date(reservation.expiresAt).getTime();
    return Math.max(0, end - Date.now());
  });

  React.useEffect(() => {
    const end = new Date(reservation.expiresAt).getTime();
    let tickCount = 0;

    const interval = setInterval(async () => {
      const remaining = Math.max(0, end - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        notifyCartChanged();
        router.refresh();
        return;
      }

      // Каждые 3 секунды проверяем живой статус в БД (вдруг мастер освободил бронь из админки)
      tickCount++;
      if (tickCount % 3 === 0) {
        try {
          const status = await checkReservationStatusAction(reservation.productId);
          if (!status.hasReservation) {
            setTimeLeftMs(0);
            toast.info("Бронь на данную куклу была освобождена.");
            notifyCartChanged();
            clearInterval(interval);
            router.refresh();
          }
        } catch {
          // Игнорируем ошибки сети
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation.expiresAt, reservation.productId, router]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpiringSoon = totalSeconds > 0 && totalSeconds < 180;
  const isExpired = totalSeconds <= 0;

  const handleRelease = () => {
    startReleaseTransition(async () => {
      try {
        const res = await releaseReservationAction({
          productId: reservation.productId,
          slug: reservation.slug,
        });

        if (res.success) {
          toast.success(`Бронь на «${reservation.dollName}» снята`, {
            description: "Кукла возвращена в каталог магазина.",
          });
          notifyCartChanged();
          router.refresh();
        } else {
          toast.error(res.error || "Не удалось освободить бронь.");
        }
      } catch {
        toast.error("Произошла ошибка при отмене брони.");
      }
    });
  };

  if (isExpired) {
    return (
      <div className="rounded-3xl border border-linen-dark bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 mb-4">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-espresso mb-2">
          Время бронирования истекло
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-6">
          15 минут для оформления заказа завершились, и кукла вернулась в каталог для всех ценителей.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default" className="rounded-full px-6">
            <Link href="/kukly">В каталог кукол</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href={`/kukly/${reservation.slug}`}>
              К кукле «{reservation.dollName}»
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer Alert Banner */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 border transition-all ${
          isExpiringSoon
            ? "border-amber-300 bg-amber-50/80 text-amber-900"
            : "border-sage/30 bg-sage-subtle/50 text-sage-dark"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isExpiringSoon
                ? "bg-amber-100 text-amber-800 animate-pulse"
                : "bg-sage/15 text-sage"
            }`}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isExpiringSoon
                ? "Внимание: время бронирования подходит к концу!"
                : "Кукла зафиксирована за вами на 15 минут"}
            </p>
            <p className="text-xs text-muted">
              Другие покупатели не могут оформить эту работу, пока действует ваша бронь.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xl sm:text-2xl font-bold tracking-tight text-espresso bg-white/80 px-4 py-1.5 rounded-xl border border-linen-dark shadow-2xs">
          <span>{String(minutes).padStart(2, "0")}</span>
          <span className="text-muted animate-pulse">:</span>
          <span>{String(seconds).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Reserved Doll Card */}
      <div className="rounded-3xl border border-linen-dark bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 pb-6 border-b border-linen-dark">
          {/* Photo */}
          <Link
            href={`/kukly/${reservation.slug}`}
            className="relative h-32 w-28 sm:h-36 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-linen border border-linen-dark group"
          >
            <Image
              src={reservation.coverImageUrl}
              alt={reservation.dollName}
              fill
              sizes="128px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Details */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
                {reservation.category}
              </span>
              <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-serif italic text-terracotta border border-terracotta/20">
                OOAK · Единственный экземпляр
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-medium text-espresso leading-snug">
              <Link
                href={`/kukly/${reservation.slug}`}
                className="hover:text-terracotta transition-colors"
              >
                «{reservation.dollName}»
              </Link>
            </h3>

            <p className="text-xs text-muted">
              Высота: {reservation.heightCm} см · Натуральный эко-хлопок макраме, резное дерево, подарочная коробка
            </p>

            <div className="pt-2 flex items-center justify-between sm:justify-start gap-4">
              <span className="text-xl sm:text-2xl font-bold text-terracotta font-sans">
                {formatPrice(reservation.priceByn)}
              </span>
              <span className="text-xs text-sage-dark bg-sage-subtle px-2.5 py-0.5 rounded-full border border-sage/20">
                Забронировано
              </span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={isReleasing}
            onClick={handleRelease}
            className="text-muted hover:text-destructive hover:bg-destructive/10 rounded-full text-xs font-normal"
          >
            {isReleasing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Освобождаем бронь...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Освободить бронь (вернуть в каталог)
              </>
            )}
          </Button>

          <Button
            asChild
            size="lg"
            variant="default"
            className="rounded-full px-8 shadow-sm font-medium"
          >
            <Link href={`/oformlenie/${reservation.slug}`}>
              <span>Перейти к оформлению заказа</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Assurance and Delivery Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-2xl border border-linen-dark/80 bg-white/60 p-4 flex items-start gap-3">
          <Truck className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
          <div className="text-xs text-muted">
            <span className="font-semibold text-espresso block mb-0.5">
              Почта или самовывоз
            </span>
            Посылки по Беларуси с трек-номером (3,50 BYN, от 120 BYN бесплатно) или самовывоз в Минске.
          </div>
        </div>

        <div className="rounded-2xl border border-linen-dark/80 bg-white/60 p-4 flex items-start gap-3">
          <Package className="h-5 w-5 text-sage shrink-0 mt-0.5" />
          <div className="text-xs text-muted">
            <span className="font-semibold text-espresso block mb-0.5">
              Подарочная упаковка
            </span>
            Крафтовая коробка, тишью, бирка и паспорт ручной работы входят в комплект.
          </div>
        </div>

        <div className="rounded-2xl border border-linen-dark/80 bg-white/60 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
          <div className="text-xs text-muted">
            <span className="font-semibold text-espresso block mb-0.5">
              Безопасная оплата
            </span>
            Карты онлайн (БЕЛКАРТ / МИР / Visa / MC), ЕРИП или наложенный платёж почты.
          </div>
        </div>
      </div>
    </div>
  );
}
