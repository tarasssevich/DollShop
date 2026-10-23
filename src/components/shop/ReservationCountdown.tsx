"use client";

import * as React from "react";
import { Clock, CheckCircle2 } from "lucide-react";

interface ReservationCountdownProps {
  reservedUntil: string | null;
  onExpire?: () => void;
  className?: string;
}

/**
 * Live minute:second countdown for active reservations.
 * Automatically signals expiration to parent when timer reaches 0.
 */
export function ReservationCountdown({
  reservedUntil,
  onExpire,
  className = "",
}: ReservationCountdownProps) {
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(() => {
    if (!reservedUntil) return null;
    const diff = Math.floor(
      (new Date(reservedUntil).getTime() - Date.now()) / 1000
    );
    return Math.max(0, diff);
  });

  const onExpireRef = React.useRef(onExpire);
  React.useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  React.useEffect(() => {
    if (!reservedUntil) return;

    const interval = setInterval(() => {
      const diff = Math.floor(
        (new Date(reservedUntil).getTime() - Date.now()) / 1000
      );
      if (diff <= 0) {
        setSecondsLeft(0);
        onExpireRef.current?.();
      } else {
        setSecondsLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservedUntil]);

  if (secondsLeft === null) {
    return null;
  }

  if (secondsLeft <= 0) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-900 ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <div>
          <span className="font-semibold">Время брони истекло!</span>{" "}
          Работа снова открыта для покупки.
        </div>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 text-xs text-amber-950 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
          <Clock className="h-4 w-4 animate-pulse" />
        </div>
        <div>
          <p className="font-medium">Кукла временно забронирована</p>
          <p className="text-[11px] text-amber-800/90">
            Покупатель заполняет данные доставки
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className="font-mono text-base font-semibold text-amber-900 tracking-wider">
          {formatted}
        </span>
        <p className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">
          до отмены
        </p>
      </div>
    </div>
  );
}
