import crypto from "node:crypto";

export const RESERVATION_COOKIE_PREFIX = "doll_res_";
export const RESERVATION_TTL_MINUTES = 15;
export const RESERVATION_TTL_SECONDS = RESERVATION_TTL_MINUTES * 60;

export function getReservationCookieName(productId: string): string {
  return `${RESERVATION_COOKIE_PREFIX}${productId}`;
}

export function hashReservationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type ReserveActionResult =
  | {
      success: true;
      redirectUrl: string;
      reservedUntil: string;
    }
  | {
      success: false;
      code:
        | "ALREADY_RESERVED"
        | "SOLD"
        | "NOT_FOUND"
        | "UNAVAILABLE"
        | "VALIDATION_ERROR"
        | "RATE_LIMITED";
      error: string;
    };

export type ReleaseActionResult =
  | { success: true }
  | { success: false; error: string };

export type ReservationStatusResult =
  | {
      hasReservation: true;
      expiresAt: string;
      secondsRemaining: number;
    }
  | {
      hasReservation: false;
      reason?: "NO_COOKIE" | "EXPIRED" | "NOT_FOUND";
    };
