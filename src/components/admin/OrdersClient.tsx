"use client";

import * as React from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Mail,
  MapPin,
  CreditCard,
  Phone,
  Send,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/format";
import { formatBelarusPhone } from "@/lib/utils/phone";
import {
  updateAdminOrderStatusAction,
  updateAdminOrderTrackingAction,
  type AdminOrderItem,
} from "@/actions/admin/orders";

interface OrdersClientProps {
  initialOrders: AdminOrderItem[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = React.useState<AdminOrderItem[]>(initialOrders);
  const [filter, setFilter] = React.useState<"all" | "pending" | "paid" | "cancelled">("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = React.useState<Record<string, string>>({});

  const filteredOrders = React.useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: "pending" | "paid" | "cancelled"
  ) => {
    try {
      const res = await updateAdminOrderStatusAction({ orderId, status: newStatus });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        toast.success(
          newStatus === "paid"
            ? "Заказ оплачен! Кукла переведена в архив (Галерею)."
            : newStatus === "cancelled"
            ? "Заказ отменен. Кукла возвращена в наличие на витрине."
            : "Статус заказа обновлен."
        );
      } else {
        toast.error(res.error || "Не удалось изменить статус");
      }
    } catch {
      toast.error("Ошибка при обновлении статуса");
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    const tracking = trackingInputs[orderId]?.trim();
    if (!tracking) return;

    try {
      const res = await updateAdminOrderTrackingAction({
        orderId,
        trackingNumber: tracking,
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, trackingNumber: tracking } : o))
        );
        toast.success("Трек-номер сохранен!");
      } else {
        toast.error(res.error || "Не удалось сохранить трек-номер");
      }
    } catch {
      toast.error("Ошибка при сохранении трек-номера");
    }
  };

  const handleCopyMessage = (order: AdminOrderItem) => {
    const name = order.customerName.split(" ")[0] || order.customerName;
    const doll = order.doll?.title || "куклу ручной работы";
    const amount = formatPrice(order.totalAmount);

    let paymentText = "";
    if (order.paymentMethod === "cod") {
      paymentText = `Оплата наложенным платежом (${amount}) при получении на почте.`;
    } else if (order.paymentMethod === "erip_invoice") {
      paymentText = `Счёт в ЕРИП на сумму ${amount} выставлен. Номер счёта: ${order.orderNumber}.`;
    } else {
      paymentText = `К оплате: ${amount}. Реквизиты для перевода на карту: ...`;
    }

    const text = `Здравствуйте, ${name}! Спасибо за заказ #${order.orderNumber} в мастерской DollShop на куколку «${doll}». ${paymentText} Мы бережно упакуем её в крафтовую коробочку. Если есть пожелания к поздравлению — напишите нам!`;

    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    toast.success("Шаблон сообщения скопирован в буфер обмена!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Фильтры статусов */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Все заказы", count: orders.length },
          {
            id: "pending",
            label: "🟡 Ожидают",
            count: orders.filter((o) => o.status === "pending").length,
          },
          {
            id: "paid",
            label: "🟢 Оплачены",
            count: orders.filter((o) => o.status === "paid").length,
          },
          {
            id: "cancelled",
            label: "⚪ Отменены",
            count: orders.filter((o) => o.status === "cancelled").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === tab.id
                ? "bg-terracotta text-white shadow-xs"
                : "bg-white border border-linen-dark text-muted hover:text-espresso"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                filter === tab.id ? "bg-white/20 text-white" : "bg-linen text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Список заказов */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linen-dark p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-linen flex items-center justify-center mx-auto text-muted">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="font-serif text-base text-espresso">Заказов не найдено</p>
          <p className="text-xs text-muted">
            {filter === "all"
              ? "Новые заказы из чекаута будут автоматически появляться здесь."
              : "Нет заказов с выбранным статусом."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const cleanDigits = ord.customerPhone.replace(/\D/g, "");
            const tgHandle = ord.customerContact?.replace(/^@/, "");

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* Хедер карточки */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linen-dark pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-medium text-espresso">
                      Заказ #{ord.orderNumber}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(ord.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Бейдж статуса */}
                  <div>
                    {ord.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                        <Clock className="h-3 w-3 text-amber-700" /> В брони · Ожидает
                      </span>
                    )}
                    {ord.status === "paid" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Оплачен · В архиве
                      </span>
                    )}
                    {ord.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <XCircle className="h-3 w-3 text-slate-500" /> Отменен
                      </span>
                    )}
                  </div>
                </div>

                {/* Основное содержимое: Кукла и Получатель */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Сводка куклы */}
                  <div className="md:col-span-6 flex gap-3.5 items-center">
                    {ord.doll?.coverUrl && (
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-linen-dark bg-alabaster">
                        <Image
                          src={ord.doll.coverUrl}
                          alt={ord.doll.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="font-serif text-base font-medium text-espresso truncate">
                        {ord.doll?.title || "Кукла ручной работы"}
                      </p>
                      <p className="font-sans text-base font-semibold text-terracotta">
                        {formatPrice(ord.totalAmount)}
                      </p>
                      <p className="text-[11px] text-muted flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-terracotta" />
                        {ord.paymentMethod === "cod" && "Наложенный платёж"}
                        {ord.paymentMethod === "erip_invoice" && "ЕРИП"}
                        {ord.paymentMethod === "bank_transfer" && "Банковский перевод"}
                      </p>
                    </div>
                  </div>

                  {/* Доставка и Получатель */}
                  <div className="md:col-span-6 space-y-1.5 text-xs text-muted">
                    <p className="font-medium text-espresso flex items-center gap-1.5">
                      {ord.deliveryCity.toLowerCase() === "минск" &&
                      ord.deliveryBranch.toLowerCase().includes("самовывоз") ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-terracotta" /> Самовывоз в Минске
                        </>
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5 text-terracotta" /> Почта: {ord.deliveryCity}, {ord.deliveryBranch}
                        </>
                      )}
                    </p>
                    <p className="text-espresso">
                      👤 {ord.customerName} · <a href={`tel:+${cleanDigits}`} className="hover:text-terracotta underline">{formatBelarusPhone(ord.customerPhone)}</a>
                    </p>
                    {ord.customerContact && (
                      <p className="text-muted">
                        💬 Ник / контакт: <b>{ord.customerContact}</b>
                      </p>
                    )}
                    {ord.comment && (
                      <p className="italic text-espresso/80 pt-0.5">
                        «{ord.comment}»
                      </p>
                    )}
                  </div>
                </div>

                {/* Почтовый трек-номер */}
                <div className="rounded-xl bg-alabaster/60 p-3 border border-linen-dark flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-terracotta" />
                    <span>Почтовый трек-номер:</span>
                    {ord.trackingNumber ? (
                      <a
                        href={`https://belpost.by/Otslezhivaniyeotpravleniy?number=${ord.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-medium text-terracotta hover:underline inline-flex items-center gap-1"
                      >
                        {ord.trackingNumber}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted italic">не указан</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="BY123456789"
                      value={trackingInputs[ord.id] ?? ""}
                      onChange={(e) =>
                        setTrackingInputs((prev) => ({
                          ...prev,
                          [ord.id]: e.target.value,
                        }))
                      }
                      className="h-8 w-36 text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSaveTracking(ord.id)}
                    >
                      Сохранить
                    </Button>
                  </div>
                </div>

                {/* Панель быстрых действий (Zero-IT UX) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-linen-dark">
                  {/* Кнопки быстрой связи с клиентом */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      asChild
                    >
                      <a href={`tel:+${cleanDigits}`}>
                        <Phone className="h-3 w-3 text-terracotta" />
                        Позвонить
                      </a>
                    </Button>

                    {tgHandle && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        asChild
                      >
                        <a
                          href={`https://t.me/${tgHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Send className="h-3 w-3 text-terracotta" />
                          Telegram
                        </a>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-muted hover:text-terracotta"
                      onClick={() => handleCopyMessage(ord)}
                    >
                      {copiedId === ord.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Шаблон сообщения
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Кнопки смены статуса заказа */}
                  <div className="flex items-center gap-2">
                    {ord.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                          onClick={() => handleStatusChange(ord.id, "cancelled")}
                        >
                          Отменить бронь
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => handleStatusChange(ord.id, "paid")}
                        >
                          ✅ Оплачен (Продана)
                        </Button>
                      </>
                    )}

                    {ord.status === "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleStatusChange(ord.id, "pending")}
                      >
                        Вернуть в ожидание
                      </Button>
                    )}

                    {ord.status === "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleStatusChange(ord.id, "pending")}
                      >
                        Возобновить заказ
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
