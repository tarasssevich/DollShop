import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  MapPin,
  CreditCard,
  Send,
  ExternalLink,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { getOrderByPublicToken } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils/format";
import { formatBelarusPhone } from "@/lib/utils/phone";
import { Button } from "@/components/ui/button";
import { generateEripQrDataUrl, ERIP_CONFIG } from "@/lib/payments/erip";
import { EripPaymentBlock } from "@/components/checkout/EripPaymentBlock";
import { OrderTrackerSync } from "@/components/checkout/OrderTrackerSync";

interface OrderPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { token } = await params;
  const order = await getOrderByPublicToken(token);

  if (!order) {
    return { title: "Заказ не найден | DollShop" };
  }

  return {
    title: `Заказ #${order.orderNumber} оформлен | DollShop`,
    description: `Информация о заказе #${order.orderNumber} в мастерской DollShop.`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderSuccessPage({ params }: OrderPageProps) {
  const { token } = await params;
  const order = await getOrderByPublicToken(token);

  if (!order) {
    notFound();
  }

  const isPickup =
    order.deliveryBranch.toLowerCase().includes("самовывоз") ||
    order.deliveryCity.toLowerCase() === "минск" &&
      order.deliveryBranch.toLowerCase().includes("согласован");

  const coverUrl = order.item?.coverUrl || "/mock/dolls/fairy-blue-1.jpg";

  const isErip =
    order.paymentMethod === "online_erip" ||
    order.paymentMethod === "erip_invoice";

  const eripQrDataUrl = isErip
    ? await generateEripQrDataUrl(order.orderNumber, Number(order.totalAmount))
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-8">
      <OrderTrackerSync
        order={{
          orderNumber: order.orderNumber,
          publicToken: order.publicToken,
          dollTitle: order.item?.productTitle || `Заказ #${order.orderNumber}`,
          dollSlug: order.item?.productSlug,
          dollCoverUrl: coverUrl,
          totalAmount: order.totalAmount,
          status: order.status,
          trackingNumber: order.trackingNumber,
          deliveryType: isPickup ? "pickup" : "postal",
          deliveryCity: order.deliveryCity,
          createdAt: order.createdAt.toISOString(),
        }}
      />
      {/* 1. Главный баннер успеха */}
      <div className="rounded-3xl border border-linen-dark bg-white p-6 sm:p-10 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-subtle border border-sage/20 text-sage-dark">
          <CheckCircle2 className="h-9 w-9 text-sage" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-muted font-medium">
            Номер заказа #{order.orderNumber}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-espresso">
            Спасибо за ваш заказ!
          </h1>
          <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed pt-1">
            Кукла надежно зафиксирована за вами. Мастер Алёна уже получила уведомление и свяжется с вами через выбранный канал для подтверждения деталей.
          </p>
        </div>

        {/* Статус заказа */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-900">
            <Clock className="h-3.5 w-3.5 text-amber-700" />
            <span>
              {order.status === "pending" && "Бронь подтверждена · Ожидает согласования"}
              {order.status === "paid" && "Оплачен · Готовится к отправке"}
              {order.status === "completed" && "Выполнен"}
              {order.status === "cancelled" && "Отменен"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Детали забронированной работы */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <h2 className="font-serif text-xl font-medium text-espresso border-b border-linen-dark pb-3">
          Детали заказа
        </h2>

        {order.item ? (
          <div className="flex gap-4 sm:gap-5 pb-5 border-b border-linen-dark items-center">
            <div className="relative h-24 w-20 sm:h-28 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-linen-dark bg-alabaster">
              <Image
                src={coverUrl}
                alt={order.item.productTitle}
                fill
                sizes="100px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-serif text-lg font-medium text-espresso truncate">
                {order.item.productTitle}
              </h3>
              <p className="text-xs text-muted">
                Авторская текстильная кукла · Единственный экземпляр (OOAK)
              </p>
              <p className="font-sans text-lg font-semibold text-terracotta pt-1">
                {formatPrice(order.item.priceAtPurchase)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Сводка доставки и оплаты */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 rounded-xl bg-alabaster/60 p-4 border border-linen-dark">
            <p className="font-medium text-espresso flex items-center gap-1.5">
              {isPickup ? (
                <>
                  <MapPin className="h-4 w-4 text-terracotta" />
                  Самовывоз в Минске
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 text-terracotta" />
                  Почта по Беларуси
                </>
              )}
            </p>
            <p className="text-muted leading-relaxed">
              {isPickup
                ? "Минск (время и место встречи согласуются с мастером)"
                : `${order.deliveryCity}, ${order.deliveryBranch}`}
            </p>

            {order.trackingNumber && (
              <div className="pt-2">
                <a
                  href={`https://belpost.by/Otslezhivaniyeotpravleniy?number=${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-terracotta font-medium hover:underline"
                >
                  <span>Трек-номер: {order.trackingNumber}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="space-y-1 rounded-xl bg-alabaster/60 p-4 border border-linen-dark">
            <p className="font-medium text-espresso flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-terracotta" />
              Способ оплаты
            </p>
            <p className="text-muted leading-relaxed">
              {order.paymentMethod === "online_card" && "Банковской картой онлайн (БЕЛКАРТ / МИР / Visa / Mastercard)"}
              {order.paymentMethod === "online_erip" && "Онлайн ЕРИП с QR-кодом"}
              {order.paymentMethod === "cod" && "Наложенный платёж при получении в отделении Белпочты"}
              {order.paymentMethod === "erip_invoice" && "ЕРИП (счёт мастера)"}
              {order.paymentMethod === "bank_transfer" && "Банковский перевод на карту мастера"}
            </p>
            <p className="pt-1 text-[11px] text-muted">
              К оплате: <b className="text-espresso font-sans text-sm">{formatPrice(order.totalAmount)}</b>
            </p>

            {order.paymentMethod === "online_card" && order.status === "pending" && (
              <div className="pt-2">
                <Link
                  href={`/oplata/sandbox/${order.publicToken}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-3 py-1.5 transition-colors shadow-xs"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Завершить оплату картой онлайн →</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Данные покупателя */}
        <div className="rounded-xl border border-linen-dark p-4 text-xs space-y-1.5 bg-white">
          <p className="font-medium text-espresso">Получатель:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted">
            <div>
              <span className="block text-[11px] text-muted/80">Имя:</span>
              <span className="text-espresso font-medium">{order.customerName}</span>
            </div>
            <div>
              <span className="block text-[11px] text-muted/80">Телефон:</span>
              <span className="text-espresso font-medium">{formatBelarusPhone(order.customerPhone)}</span>
            </div>
            <div>
              <span className="block text-[11px] text-muted/80">Связь через:</span>
              <span className="text-espresso font-medium capitalize">
                {order.contactChannel}
                {order.customerContact ? ` (${order.customerContact})` : ""}
              </span>
            </div>
          </div>

          {order.comment && (
            <div className="pt-2 border-t border-linen-dark mt-2">
              <span className="block text-[11px] text-muted/80">Комментарий к заказу:</span>
              <p className="italic text-espresso">«{order.comment}»</p>
            </div>
          )}
        </div>
      </div>

      {/* 2.1 Интерактивный блок ЕРИП (Step 6.3) */}
      {isErip && (
        <EripPaymentBlock
          orderId={order.id}
          orderNumber={order.orderNumber}
          dollTitle={order.item?.productTitle || `Заказ #${order.orderNumber}`}
          amountByn={Number(order.totalAmount)}
          qrDataUrl={eripQrDataUrl}
          treeSteps={ERIP_CONFIG.treeSteps}
          isPaid={order.status === "paid" || order.status === "completed"}
        />
      )}

      {/* 3. Связь с мастером и возврат в магазин */}
      <div className="rounded-2xl border border-linen-dark bg-alabaster/60 p-6 text-center space-y-4">
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="font-serif text-lg font-medium text-espresso">
            Есть вопрос или хотите ускорить отправку?
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Вы можете написать мастеру прямо сейчас в Telegram или позвонить. Мы на связи ежедневно с 10:00 до 21:00.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://t.me/dollshop_by"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-linen-dark px-4 py-2.5 text-xs font-medium text-espresso shadow-xs hover:border-terracotta hover:text-terracotta transition-colors"
          >
            <Send className="h-4 w-4 text-terracotta" />
            <span>Написать в Telegram</span>
          </a>

          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/kukly">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Вернуться в каталог кукол
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
