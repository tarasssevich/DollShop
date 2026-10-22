"use client";

import * as React from "react";
import { Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DollStatus } from "@/types/domain";
import { getEffectiveDollStatus } from "@/lib/data/catalog";

interface StatusBadgeProps {
  status: DollStatus;
  reservedUntil?: string | null;
  className?: string;
}

export function StatusBadge({
  status,
  reservedUntil = null,
  className,
}: StatusBadgeProps) {
  const [minutesLeft, setMinutesLeft] = React.useState<number | null>(() => {
    if (status === "reserved" && reservedUntil) {
      const diff = new Date(reservedUntil).getTime() - Date.now();
      return diff > 0 ? Math.ceil(diff / (60 * 1000)) : 0;
    }
    return null;
  });

  React.useEffect(() => {
    if (status !== "reserved" || !reservedUntil) return;

    const interval = setInterval(() => {
      const diff = new Date(reservedUntil).getTime() - Date.now();
      const mins = diff > 0 ? Math.ceil(diff / (60 * 1000)) : 0;
      setMinutesLeft(mins);
    }, 15000);

    return () => clearInterval(interval);
  }, [status, reservedUntil]);

  const effectiveStatus = getEffectiveDollStatus({ status, reservedUntil });

  switch (effectiveStatus) {
    case "available":
      return (
        <Badge variant="available" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          В наличии
        </Badge>
      );

    case "reserved":
      return (
        <Badge variant="reserved" className={className}>
          <Clock className="h-3 w-3" />
          {minutesLeft && minutesLeft > 0
            ? `В резерве (~${minutesLeft} мин)`
            : "В резерве"}
        </Badge>
      );

    case "sold":
      return (
        <Badge variant="sold" className={className}>
          В частной коллекции
        </Badge>
      );

    case "in_progress":
      return (
        <Badge variant="in_progress" className={className}>
          <Sparkles className="h-3 w-3" />
          В процессе
        </Badge>
      );

    default:
      return null;
  }
}
