/** Событие для мгновенного обновления счётчика корзины в шапке после брони/отмены. */
export const CART_CHANGED_EVENT = "dollshop:cart-changed";

export function notifyCartChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }
}
