"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Truck,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import {
  getLocalOrders,
  removeLocalOrder,
  mergeLocalOrders,
  ORDERS_UPDATED_EVENT,
  type ClientStoredOrder,
} from "@/lib/data/recent-orders";
import { type PublicOrderSummary } from "@/actions/order";
import { OrderLookupByPhone } from "./OrderLookupByPhone";
import { Button } from "@/components/ui/button";

interface MyOrdersListProps {
  initialOrders?: PublicOrderSummary[];
  title?: string;
}

export function MyOrdersList({
  initialOrders = [],
  title = "Мои покупки и заказы",
}: MyOrdersListProps) {
  const [orders, setOrders] = React.useState<ClientStoredOrder[]>(() => {
    // Начальное состояние: берем initialOrders (пришедшие из SSR по cookies)
    return initialOrders.map((o) => ({
      orderNumber: o.orderNumber,
      publicToken: o.publicToken,
      dollTitle: o.dollTitle,
      dollSlug: o.dollSlug,
      dollCoverUrl: o.dollCoverUrl,
      totalAmount: o.totalAmount,
      status: o.status,
      trackingNumber: o.trackingNumber,
      deliveryType: o.deliveryType,
      deliveryCity: o.deliveryCity,
      createdAt: o.createdAt,
    }));
  });

  const [isClient, setIsClient] = React.useState(false);
  const [showLookup, setShowLookup] = React.useState(false);

  // Синхронизация с localStorage на клиенте
  const syncWithLocalStorage = React.useCallback(() => {
    const local = getLocalOrders();
    if (local.length > 0) {
      // Объединяем local с SSR
      const map = new Map<number, ClientStoredOrder>();
      for (const ord of local) {
        map.set(ord.orderNumber, ord);
      }
      for (const ord of initialOrders) {
        // SSR имеет более свежий статус из базы данных!
        map.set(ord.orderNumber, {
          orderNumber: ord.orderNumber,
          publicToken: ord.publicToken,
          dollTitle: ord.dollTitle,
          dollSlug: ord.dollSlug,
          dollCoverUrl: ord.dollCoverUrl,
          totalAmount: ord.totalAmount,
          status: ord.status,
          trackingNumber: ord.trackingNumber,
          deliveryType: ord.deliveryType,
          deliveryCity: ord.deliveryCity,
          createdAt: ord.createdAt,
        });
      }
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
      // Обновляем localStorage свежими данными из базы
      mergeLocalOrders(sorted);
    } else if (initialOrders.length > 0) {
      mergeLocalOrders(initialOrders);
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  React.useEffect(() => {
    setIsClient(true);
    syncWithLocalStorage();

    const handleUpdate = () => {
      const local = getLocalOrders();
      setOrders(local);
    };

    window.addEventListener(ORDERS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(ORDERS_UPDATED_EVENT, handleUpdate);
  }, [syncWithLocalStorage]);

  const handleHideOrder = (e: React.MouseEvent, orderNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeLocalOrder(orderNumber);
    setOrders((prev) => prev.filter((o) => o.orderNumber !== orderNumber));
  };

  const hasOrders = orders.length > 0;

  return (
    <div className="space-y-6">
      {hasOrders ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-linen-dark pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                <Package className="h-4 w-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-light text-espresso">
                {title}
                <span className="ml-2 text-xs font-sans font-medium text-muted bg-linen px-2 py-0.5 rounded-full border border-linen-dark">
                  {orders.length}
                </span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowLookup((prev) => !prev)}
              className="text-xs text-muted hover:text-terracotta transition-colors text-left sm:text-right"
            >
              {showLookup ? "Скрыть форму поиска" : "Найти заказ по телефону →"}
            </button>
          </div>

          {showLookup && (
            <div className="pt-1 pb-2">
              <OrderLookupByPhone />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const coverUrl = order.dollCoverUrl || "/mock/dolls/fairy-blue-1.jpg";
              const isPaid = order.status === "paid" || order.status === "completed";
              const isPending = order.status === "pending";
              const isCancelled = order.status === "cancelled";

              return (
                <div
                  key={order.orderNumber}
                  className="group relative rounded-2xl border border-linen-dark bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-terracotta/40 hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Фото куклы */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-linen-dark bg-alabaster">
                      <Image
                        src={coverUrl}
                        alt={order.dollTitle}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    {/* Информация о заказе */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-medium text-muted">
                          Заказ #{order.orderNumber}
                        </span>
                        <span className="text-linen-dark text-xs">·</span>
                        <span className="text-xs text-muted">
                          {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                          })}
                        </span>

                        {/* Статус */}
                        <div className="ml-auto flex items-center">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Оплачен · Готовится к отправке</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Бронь подтверждена · Ожидает оплаты</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-medium text-rose-800">
                              <span>Отменен</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-serif text-lg font-medium text-espresso truncate">
                        {order.dollTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted pt-0.5">
                        <span className="font-sans font-semibold text-espresso">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span>·</span>
                        <span>
                          {order.deliveryType === "pickup"
                            ? "Самовывоз в Минске"
                            : `Почта по Беларуси (${order.deliveryCity || "доставка"})`}
                        </span>
                      </div>

                      {/* Трек-номер посылки Белпочты */}
                      {order.trackingNumber ? (
                        <div className="pt-2 flex items-center gap-2">
                          <a
                            href={`https://belpost.by/Otslezhivaniyeotpravleniy?number=${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-linen px-2.5 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/10 transition-colors"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Трек-номер Белпочты: {order.trackingNumber}</span>
                            <ExternalLink className="h-3 w-3 ml-0.5" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted/80 pt-1 italic">
                          Трек-номер появится здесь, как только мастер передаст посылку на Белпочту.
                        </p>
                      )}
                    </div>

                    {/* Действия */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-linen-dark">
                      <Button asChild size="sm" variant="default" className="rounded-xl shadow-2xs">
                        <Link href={`/zakaz/${order.publicToken}`}>
                          <span>Детали заказа</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>

                      {isClient && (
                        <button
                          type="button"
                          onClick={(e) => handleHideOrder(e, order.orderNumber)}
                          title="Скрыть из этого браузера"
                          className="text-[11px] text-muted/60 hover:text-espresso transition-colors inline-flex items-center gap-1 px-1.5 py-1"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>Скрыть</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Если заказов в браузере еще нет */
        <div className="space-y-4">
          <OrderLookupByPhone />
        </div>
      )}
    </div>
  );
}
