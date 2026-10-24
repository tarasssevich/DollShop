export interface ClientStoredOrder {
  orderNumber: number;
  publicToken: string;
  dollTitle: string;
  dollSlug?: string;
  dollCoverUrl?: string | null;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "completed";
  trackingNumber?: string | null;
  deliveryType?: "postal" | "pickup";
  deliveryCity?: string;
  createdAt: string;
}

export const ORDERS_STORAGE_KEY = "dollshop_recent_orders";
export const ORDERS_UPDATED_EVENT = "dollshop_recent_orders_updated";

/**
 * Получение сохраненных заказов из localStorage.
 */
export function getLocalOrders(): ClientStoredOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Оповещение других компонентов о том, что список заказов обновился.
 */
export function dispatchOrdersUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));
}

/**
 * Сохранение одного нового заказа в localStorage.
 */
export function saveLocalOrder(order: ClientStoredOrder): void {
  if (typeof window === "undefined") return;

  try {
    const current = getLocalOrders();
    const filtered = current.filter((o) => o.orderNumber !== order.orderNumber);
    const updated = [order, ...filtered].slice(0, 20); // храним до 20 последних заказов
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    dispatchOrdersUpdated();
  } catch (err) {
    console.error("Не удалось сохранить заказ в localStorage:", err);
  }
}

/**
 * Слияние списка заказов (например, полученных по номеру телефона) с текущими.
 */
export function mergeLocalOrders(newOrders: ClientStoredOrder[]): void {
  if (typeof window === "undefined" || newOrders.length === 0) return;

  try {
    const current = getLocalOrders();
    const map = new Map<number, ClientStoredOrder>();

    // Сначала старые
    for (const order of current) {
      map.set(order.orderNumber, order);
    }
    // Перезаписываем или добавляем свежие
    for (const order of newOrders) {
      map.set(order.orderNumber, order);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(merged.slice(0, 20)));
    dispatchOrdersUpdated();
  } catch (err) {
    console.error("Не удалось объединить заказы в localStorage:", err);
  }
}

/**
 * Удаление заказа из локального хранилища (если покупатель сам захотел скрыть).
 */
export function removeLocalOrder(orderNumber: number): void {
  if (typeof window === "undefined") return;

  try {
    const current = getLocalOrders();
    const filtered = current.filter((o) => o.orderNumber !== orderNumber);
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
    dispatchOrdersUpdated();
  } catch (err) {
    console.error("Не удалось удалить заказ из localStorage:", err);
  }
}
