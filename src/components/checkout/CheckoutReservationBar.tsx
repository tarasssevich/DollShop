"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { releaseReservationAction } from "@/actions/reserve";

interface CheckoutReservationBarProps {
  productId: string;
  slug: string;
  dollName: string;
  reservedUntil: string; // ISO string
}

export function CheckoutReservationBar({
  productId,
  slug,
  dollName,
  reservedUntil,
}: CheckoutReservationBarProps) {
  const router = useRouter();
  const [isReleasing, startReleaseTransition] = React.useTransition();
  const [timeLeftMs, setTimeLeftMs] = React.useState<number>(() => {
    const end = new Date(reservedUntil).getTime();
    return Math.max(0, end - Date.now());
  });

  React.useEffect(() => {
    const end = new Date(reservedUntil).getTime();

    const interval = setInterval(() => {
      const remaining = Math.max(0, end - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservedUntil]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpiringSoon = totalSeconds > 0 && totalSeconds < 180; // Менее 3 минут
  const isExpired = totalSeconds <= 0;

  const handleRelease = () => {
    startReleaseTransition(async () => {
      try {
        const res = await releaseReservationAction({ productId, slug });
        if (res.success) {
          toast.success(`Бронь на «${dollName}» снята`, {
            description: "Кукла снова доступна в каталоге для всех покупателей.",
          });
          router.push(`/kukly/${slug}`);
        } else {
          toast.error(res.error || "Не удалось снять бронь.");
        }
      } catch {
        toast.error("Произошла ошибка при отмене брони.");
      }
    });
  };

  if (isExpired) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-medium text-sm">Время бронирования истекло</p>
            <p className="text-xs text-rose-700">
              Кукла вернулась в свободную продажу в каталоге.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white border-rose-300 text-rose-800 hover:bg-rose-100/60"
          onClick={() => router.push(`/kukly/${slug}`)}
        >
          Вернуться к кукле
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isExpiringSoon
          ? "border-amber-300 bg-amber-50/90 text-amber-950"
          : "border-linen-dark bg-white text-espresso"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isExpiringSoon
              ? "bg-amber-100 text-amber-800"
              : "bg-terracotta/10 text-terracotta"
          }`}
        >
          {isExpiringSoon ? (
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Кукла забронирована за вами
            </span>
            <span
              className={`font-mono text-base font-semibold px-2 py-0.5 rounded-md ${
                isExpiringSoon
                  ? "bg-amber-200/80 text-amber-950"
                  : "bg-linen text-espresso"
              }`}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            У вас есть 15 минут для завершения оформления, чтобы никто другой не перехватил работу.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="ghost"
          size="sm"
          disabled={isReleasing}
          onClick={handleRelease}
          className="text-xs text-muted hover:text-terracotta hover:bg-linen/80 w-full sm:w-auto"
        >
          {isReleasing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Отменяем бронь...
            </>
          ) : (
            "Отменить бронь"
          )}
        </Button>
      </div>
    </div>
  );
}
