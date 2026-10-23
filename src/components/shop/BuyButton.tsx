"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Clock,
  Sparkles,
  Heart,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/format";
import { getEffectiveDollStatus } from "@/lib/data/status";
import type { Doll } from "@/types/domain";
import { ReservationCountdown } from "./ReservationCountdown";
import { reserveProductAction } from "@/actions/reserve";
import { notifyCartChanged } from "@/lib/reservation/events";

interface BuyButtonProps {
  doll: Pick<
    Doll,
    "id" | "slug" | "name" | "priceByn" | "status" | "reservedUntil"
  >;
  isStickyMobile?: boolean;
}

export function BuyButton({ doll, isStickyMobile = false }: BuyButtonProps) {
  const router = useRouter();
  const [isReserving, startTransition] = React.useTransition();

  // Client state to reflect real-time status changes (e.g. expiration)
  const [effectiveStatus, setEffectiveStatus] = React.useState(() =>
    getEffectiveDollStatus({
      status: doll.status,
      reservedUntil: doll.reservedUntil,
    })
  );

  const [reserveModalOpen, setReserveModalOpen] = React.useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = React.useState(false);
  const [notifyContact, setNotifyContact] = React.useState("");
  const [isLiked, setIsLiked] = React.useState(false);

  // Handle timer expiration
  const handleExpire = React.useCallback(() => {
    setEffectiveStatus("available");
  }, []);

  const handleReserveClick = () => {
    setReserveModalOpen(true);
  };

  const handleConfirmReservation = () => {
    startTransition(async () => {
      try {
        const res = await reserveProductAction({
          productId: doll.id,
          slug: doll.slug,
        });

        if (res.success) {
          setReserveModalOpen(false);
          toast.success(`Бронь на «${doll.name}» оформлена!`, {
            description: "У вас есть 15 минут для оформления заказа.",
          });
          notifyCartChanged();
          router.push(res.redirectUrl);
        } else {
          setReserveModalOpen(false);
          if (res.code === "ALREADY_RESERVED") {
            setEffectiveStatus("reserved");
            toast.error("Кукла только что забронирована другим покупателем", {
              description:
                "Вы можете оставить контакты — если бронь снимется через 15 минут, мы сразу вам сообщим.",
              duration: 7000,
            });
            setNotifyModalOpen(true);
          } else if (res.code === "SOLD") {
            setEffectiveStatus("sold");
            toast.error("Кукла уже продана", {
              description:
                "Вы можете заказать похожую куклу по индивидуальным пожеланиям.",
            });
          } else {
            toast.error(
              res.error || "Не удалось забронировать куклу. Попробуйте еще раз."
            );
          }
        }
      } catch {
        setReserveModalOpen(false);
        toast.error("Произошла непредвиденная ошибка при бронировании.");
      }
    });
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact.trim()) return;
    setNotifyModalOpen(false);
    toast.success("Мы уведомим вас!", {
      description: `Если бронь на «${doll.name}» снимется, мы сразу отправим вам сообщение.`,
    });
    setNotifyContact("");
  };

  // Sticky mobile bottom bar layout
  if (isStickyMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-linen-dark bg-white/95 backdrop-blur-md p-3 sm:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-sm font-medium text-espresso truncate">
              {doll.name}
            </p>
            <p className="font-sans text-base font-semibold text-terracotta">
              {formatPrice(doll.priceByn)}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => {
                const nextState = !isLiked;
                setIsLiked(nextState);
                toast(
                  nextState
                    ? "Добавлено в избранное"
                    : "Удалено из избранного",
                  {
                    description: doll.name,
                  }
                );
              }}
              aria-label="В избранное"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? "fill-terracotta text-terracotta" : "text-muted"
                }`}
              />
            </Button>

            {effectiveStatus === "available" && (
              <Button
                variant="default"
                size="default"
                className="h-11 px-5 shadow-sm"
                onClick={handleReserveClick}
              >
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                Купить
              </Button>
            )}

            {effectiveStatus === "reserved" && (
              <Button
                variant="outline"
                size="default"
                className="h-11 border-amber-300 text-amber-900 bg-amber-50/80 px-3 text-xs"
                onClick={() => setNotifyModalOpen(true)}
              >
                <Clock className="h-3.5 w-3.5 mr-1 text-amber-700" />
                В брони · Сообщить
              </Button>
            )}

            {effectiveStatus === "sold" && (
              <Button asChild variant="secondary" size="default" className="h-11">
                <Link href={`/na-zakaz?from=${doll.slug}`}>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  На заказ
                </Link>
              </Button>
            )}

            {effectiveStatus === "in_progress" && (
              <Button asChild variant="outline" size="default" className="h-11">
                <Link href={`/na-zakaz?from=${doll.slug}`}>
                  Предзаказ
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Modals reuse */}
        <ReservationDialog
          open={reserveModalOpen}
          onOpenChange={setReserveModalOpen}
          dollName={doll.name}
          priceByn={doll.priceByn}
          isLoading={isReserving}
          onConfirm={handleConfirmReservation}
        />
        <NotifyDialog
          open={notifyModalOpen}
          onOpenChange={setNotifyModalOpen}
          dollName={doll.name}
          contact={notifyContact}
          onContactChange={setNotifyContact}
          onSubmit={handleNotifySubmit}
        />
      </div>
    );
  }

  // Normal in-page card layout
  return (
    <div className="space-y-4 rounded-2xl border border-linen-dark bg-alabaster/60 p-5 sm:p-6">
      {/* Price & reservation timer header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linen-dark/80 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-medium">
            Стоимость работы
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-sans text-3xl font-semibold text-terracotta">
              {formatPrice(doll.priceByn)}
            </span>
            <span className="text-xs text-muted">
              (почта по тарифам или самовывоз бесплатно)
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted hover:text-terracotta gap-1.5"
          onClick={() => {
            const next = !isLiked;
            setIsLiked(next);
            toast(
              next ? "Добавлено в избранное" : "Удалено из избранного",
              { description: doll.name }
            );
          }}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isLiked ? "fill-terracotta text-terracotta" : ""
            }`}
          />
          {isLiked ? "В избранном" : "В список желаний"}
        </Button>
      </div>

      {/* Reservation countdown if reserved */}
      {effectiveStatus === "reserved" && (
        <ReservationCountdown
          reservedUntil={doll.reservedUntil}
          onExpire={handleExpire}
        />
      )}

      {/* CTA Button variations depending on status */}
      <div className="space-y-2.5 pt-1">
        {effectiveStatus === "available" && (
          <>
            <Button
              variant="default"
              size="lg"
              className="w-full text-base py-6 shadow-md hover:shadow-lg transition-all"
              onClick={handleReserveClick}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Забронировать и оформить
            </Button>
            <p className="text-center text-[11px] text-muted leading-relaxed">
              ⚡ Фиксация за вами на 15 минут · Оплата при получении или онлайн
            </p>
          </>
        )}

        {effectiveStatus === "reserved" && (
          <div className="space-y-2">
            <Button
              variant="outline"
              disabled
              size="lg"
              className="w-full opacity-70 cursor-not-allowed bg-amber-50/50 border-amber-200 text-amber-900"
            >
              <Clock className="h-4 w-4 mr-2" />
              Временно забронирована
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="w-full text-xs"
              onClick={() => setNotifyModalOpen(true)}
            >
              <Bell className="h-3.5 w-3.5 mr-1.5 text-terracotta" />
              Сообщить мне, если бронь снимется
            </Button>
          </div>
        )}

        {effectiveStatus === "sold" && (
          <div className="space-y-2.5">
            <div className="rounded-xl bg-linen p-3 text-center text-xs text-muted">
              Кукла уже нашла свой дом и находится в частной коллекции.
            </div>
            <Button asChild variant="default" size="lg" className="w-full">
              <Link href={`/na-zakaz?from=${doll.slug}`}>
                <Sparkles className="h-4 w-4 mr-2" />
                Заказать похожую фею по мотивам
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {effectiveStatus === "in_progress" && (
          <div className="space-y-2.5">
            <div className="rounded-xl bg-sage-subtle p-3 text-center text-xs text-sage-dark font-medium">
              Работа сейчас создается в мастерской. Вы можете оставить бронь до завершения.
            </div>
            <Button asChild variant="default" size="lg" className="w-full">
              <Link href={`/na-zakaz?from=${doll.slug}`}>
                <Sparkles className="h-4 w-4 mr-2" />
                Оформить предзаказ феи
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Trust micro-badges */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-linen-dark text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-sage shrink-0" />
          <span>100% ручной труд мастера</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-terracotta shrink-0" />
          <span>Почта с трек-номером или самовывоз</span>
        </div>
      </div>

      {/* Dialogs */}
      <ReservationDialog
        open={reserveModalOpen}
        onOpenChange={setReserveModalOpen}
        dollName={doll.name}
        priceByn={doll.priceByn}
        isLoading={isReserving}
        onConfirm={handleConfirmReservation}
      />
      <NotifyDialog
        open={notifyModalOpen}
        onOpenChange={setNotifyModalOpen}
        dollName={doll.name}
        contact={notifyContact}
        onContactChange={setNotifyContact}
        onSubmit={handleNotifySubmit}
      />
    </div>
  );
}

// Dialog for confirming reservation
function ReservationDialog({
  open,
  onOpenChange,
  dollName,
  priceByn,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dollName: string;
  priceByn: number;
  isLoading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 rounded-full px-2.5 py-0.5 border border-amber-200/80 w-fit mb-1">
            <Clock className="h-3 w-3" /> 15 минут на оформление
          </div>
          <DialogTitle className="font-serif text-2xl">
            Бронирование «{dollName}»
          </DialogTitle>
          <DialogDescription className="text-xs text-muted leading-relaxed">
            Поскольку каждая фея создается в единственном экземпляре, мы фиксируем
            ее за вами на 15 минут, чтобы никто другой не мог ее перехватить.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 border-y border-linen-dark text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Работа:</span>
            <span className="font-medium text-espresso truncate max-w-[220px]">
              {dollName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Стоимость:</span>
            <span className="font-semibold text-terracotta">
              {formatPrice(priceByn)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Упаковка:</span>
            <span className="text-espresso">Крафтовая коробка с лентой</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Отмена
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={isLoading}
            onClick={onConfirm}
            className="min-w-[190px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Бронируем...
              </>
            ) : (
              <>
                Перейти к оформлению
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog for notification on release
function NotifyDialog({
  open,
  onOpenChange,
  dollName,
  contact,
  onContactChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dollName: string;
  contact: string;
  onContactChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Уведомить об освобождении «{dollName}»
            </DialogTitle>
            <DialogDescription className="text-xs text-muted leading-relaxed">
              Оставьте ваш номер телефона или ник в Telegram. Если покупатель не
              завершит оформление в течение 15 минут, мы мгновенно пришлем вам ссылку
              на фею «{dollName}».
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Label htmlFor="notify-contact">Телефон (+375) или Telegram</Label>
            <Input
              id="notify-contact"
              placeholder="+375 (29) 123-45-67 или @username"
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" variant="default">
              Подписаться на уведомление
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
