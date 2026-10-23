import type { Doll, DollStatus } from "@/types/domain";

/**
 * Чистая утилита расчета эффективного статуса куклы с учетом таймера брони.
 * Безопасна для импорта как в Server Components, так и в Client Components ("use client").
 */
export function getEffectiveDollStatus(
  doll: Pick<Doll, "status" | "reservedUntil">,
  now: Date = new Date()
): DollStatus {
  if (doll.status === "reserved" && doll.reservedUntil) {
    const expiresAt = new Date(doll.reservedUntil);
    if (expiresAt.getTime() <= now.getTime()) {
      return "available";
    }
  }
  return doll.status;
}
