"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  MapPin,
  CreditCard,
  Building,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  Send,
  Phone,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/format";
import { formatAsBelarusPhoneInput } from "@/lib/utils/phone";
import { createOrderAction } from "@/actions/order";
import { saveLocalOrder } from "@/lib/data/recent-orders";

interface CheckoutFormProps {
  productId: string;
  slug: string;
  dollName: string;
  dollPriceByn: number;
}

export function CheckoutForm({
  productId,
  slug,
  dollName,
  dollPriceByn,
}: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Form State
  const [deliveryType, setDeliveryType] = React.useState<"postal" | "pickup">("postal");
  const [deliveryCity, setDeliveryCity] = React.useState("");
  const [deliveryBranch, setDeliveryBranch] = React.useState("");

  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("+375 ");
  const [contactChannel, setContactChannel] = React.useState<"telegram" | "viber" | "call">("telegram");
  const [customerContact, setCustomerContact] = React.useState("");

  const [paymentMethod, setPaymentMethod] = React.useState<
    "cod" | "erip_invoice" | "bank_transfer" | "online_card" | "online_erip"
  >("online_card");
  const [comment, setComment] = React.useState("");

  const [pdConsent, setPdConsent] = React.useState(true);
  const [offerConsent, setOfferConsent] = React.useState(true);
  const [honeypot, setHoneypot] = React.useState("");

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (customerName.trim().length < 3) {
      setErrorMessage("Пожалуйста, укажите ваше имя и фамилию (не менее 3 символов)");
      return;
    }

    if (deliveryType === "postal") {
      if (!deliveryCity.trim()) {
        setErrorMessage("Укажите город или населённый пункт для отправки почтой");
        return;
      }
      if (!deliveryBranch.trim()) {
        setErrorMessage("Укажите номер почтового отделения связи (ОПС) или индекс");
        return;
      }
    }

    if (!pdConsent || !offerConsent) {
      setErrorMessage("Для оформления заказа необходимо подтвердить согласие с офертой и обработкой персональных данных");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createOrderAction({
          productId,
          slug,
          dollName,
          dollPriceByn,
          customerName,
          customerPhone,
          contactChannel,
          customerContact: customerContact.trim() || undefined,
          deliveryType,
          deliveryCity: deliveryType === "postal" ? deliveryCity : undefined,
          deliveryBranch: deliveryType === "postal" ? deliveryBranch : undefined,
          paymentMethod,
          comment: comment.trim() || undefined,
          pdConsent,
          offerConsent,
          honeypot,
        });

        if (res.success) {
          saveLocalOrder({
            orderNumber: res.orderNumber,
            publicToken: res.publicToken,
            dollTitle: dollName,
            dollSlug: slug,
            totalAmount: dollPriceByn,
            status: "pending",
            deliveryType,
            deliveryCity: deliveryType === "postal" ? deliveryCity : "Минск",
            createdAt: new Date().toISOString(),
          });

          toast.success(`Заказ #${res.orderNumber} успешно оформлен!`, {
            description: "Бронь зафиксирована. Мы перенаправляем вас на страницу заказа.",
          });
          router.push(res.redirectUrl);
        } else {
          setErrorMessage(res.error);
          toast.error(res.error);
        }
      } catch {
        const err = "Произошла непредвиденная ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.";
        setErrorMessage(err);
        toast.error(err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Способ получения: Почта или Самовывоз */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white text-xs font-sans">
            1
          </span>
          Способ получения
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setDeliveryType("postal");
              if (paymentMethod === "bank_transfer") {
                // Keep
              }
            }}
            className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer flex items-start gap-3 ${
              deliveryType === "postal"
                ? "border-terracotta bg-terracotta/5 shadow-xs"
                : "border-linen-dark bg-alabaster/40 hover:bg-linen/60 text-muted"
            }`}
          >
            <Mail className={`h-5 w-5 shrink-0 mt-0.5 ${deliveryType === "postal" ? "text-terracotta" : "text-muted"}`} />
            <div>
              <p className="font-medium text-sm text-espresso">Почта по Беларуси</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Отправка с трек-номером в любое почтовое отделение РБ
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeliveryType("pickup");
              if (paymentMethod === "cod") {
                setPaymentMethod("erip_invoice"); // При самовывозе наложенный платеж меняется на ЕРИП / перевод
              }
            }}
            className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer flex items-start gap-3 ${
              deliveryType === "pickup"
                ? "border-terracotta bg-terracotta/5 shadow-xs"
                : "border-linen-dark bg-alabaster/40 hover:bg-linen/60 text-muted"
            }`}
          >
            <MapPin className={`h-5 w-5 shrink-0 mt-0.5 ${deliveryType === "pickup" ? "text-terracotta" : "text-muted"}`} />
            <div>
              <p className="font-medium text-sm text-espresso">Самовывоз в Минске</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Бесплатно по предварительному согласованию с мастером
              </p>
            </div>
          </button>
        </div>

        {deliveryType === "postal" ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliv-city" className="text-xs">
                  Город / населённый пункт <span className="text-terracotta">*</span>
                </Label>
                <Input
                  id="deliv-city"
                  placeholder="Минск, Гродно, Брест..."
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliv-branch" className="text-xs">
                  Почтовое отделение (ОПС) или индекс <span className="text-terracotta">*</span>
                </Label>
                <Input
                  id="deliv-branch"
                  placeholder="ОПС № 230005 или индекс 220012"
                  value={deliveryBranch}
                  onChange={(e) => setDeliveryBranch(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted">
                  6 цифр индекса (например, 220030) или номер отделения
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted">
              📦 Стоимость пересылки по тарифам РУП «Белпочта» оплачивается при получении посылки.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-linen/70 p-3.5 text-xs text-muted leading-relaxed">
            <p className="font-medium text-espresso mb-1">Информация о самовывозе:</p>
            Самовывоз осуществляется в Минске (район ст. м. Восток или центр по договоренности). После оформления заказа мастер свяжется с вами для согласования удобного дня и времени встречи.
          </div>
        )}
      </div>

      {/* 2. Контактные данные покупателя */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white text-xs font-sans">
            2
          </span>
          Данные получателя
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name" className="text-xs">
              Имя и Фамилия <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="cust-name"
              placeholder="Анна Иванова"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-phone" className="text-xs">
              Номер телефона <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="cust-phone"
              type="tel"
              placeholder="+375 (29) 123-45-67"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatAsBelarusPhoneInput(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Канал связи */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs">Удобный канал для связи с мастером:</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "telegram", label: "Telegram", icon: Send },
              { id: "viber", label: "Viber", icon: Phone },
              { id: "call", label: "Звонок", icon: Phone },
            ].map((ch) => (
              <button
                type="button"
                key={ch.id}
                onClick={() => setContactChannel(ch.id as "telegram" | "viber" | "call")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  contactChannel === ch.id
                    ? "border-terracotta bg-terracotta text-white shadow-xs"
                    : "border-linen-dark bg-alabaster/60 text-muted hover:text-espresso hover:bg-linen"
                }`}
              >
                <span>{ch.label}</span>
              </button>
            ))}
          </div>

          {contactChannel === "telegram" && (
            <div className="pt-2">
              <Label htmlFor="cust-tg" className="text-xs text-muted">
                Ваш ник в Telegram:
              </Label>
              <Input
                id="cust-tg"
                placeholder="@username"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Способ оплаты */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white text-xs font-sans">
            3
          </span>
          Способ оплаты
        </h2>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(val) =>
            setPaymentMethod(
              val as
                | "cod"
                | "erip_invoice"
                | "bank_transfer"
                | "online_card"
                | "online_erip"
            )
          }
          className="space-y-2.5"
        >
          {/* 1. Онлайн-оплата картой (Фаза 6) */}
          <label
            htmlFor="pay-online-card"
            className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
              paymentMethod === "online_card"
                ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                : "border-linen-dark hover:bg-linen/40"
            }`}
          >
            <RadioGroupItem value="online_card" id="pay-online-card" className="mt-1 text-emerald-600" />
            <div>
              <p className="font-medium text-sm text-espresso flex flex-wrap items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Банковской картой онлайн (БЕЛКАРТ / МИР / Visa / Mastercard)
                <span className="text-[10px] font-sans font-medium text-emerald-800 bg-emerald-100 rounded-full px-2 py-0.2">
                  Мгновенно
                </span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                Безопасная оплата через 3-D Secure без комиссии. Электронный чек сразу после оплаты
              </p>
            </div>
          </label>

          {/* 2. Онлайн ЕРИП с QR-кодом (Фаза 6) */}
          <label
            htmlFor="pay-online-erip"
            className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
              paymentMethod === "online_erip"
                ? "border-terracotta bg-terracotta/5 shadow-xs"
                : "border-linen-dark hover:bg-linen/40"
            }`}
          >
            <RadioGroupItem value="online_erip" id="pay-online-erip" className="mt-1" />
            <div>
              <p className="font-medium text-sm text-espresso flex flex-wrap items-center gap-1.5">
                <QrCode className="h-4 w-4 text-terracotta" />
                Онлайн ЕРИП с QR-кодом
                <span className="text-[10px] font-sans font-medium text-amber-800 bg-amber-100 rounded-full px-2 py-0.2">
                  QR-код
                </span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                Счёт в системе «Расчет» (ЕРИП) с QR-кодом для приложения любого банка Беларуси
              </p>
            </div>
          </label>

          {deliveryType === "postal" && (
            <label
              htmlFor="pay-cod"
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                paymentMethod === "cod"
                  ? "border-terracotta bg-terracotta/5 shadow-xs"
                  : "border-linen-dark hover:bg-linen/40"
              }`}
            >
              <RadioGroupItem value="cod" id="pay-cod" className="mt-1" />
              <div>
                <p className="font-medium text-sm text-espresso flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-terracotta" />
                  Наложенный платёж
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Оплата наличными или банковской картой в отделении Белпочты при получении посылки
                </p>
              </div>
            </label>
          )}

          <label
            htmlFor="pay-erip"
            className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
              paymentMethod === "erip_invoice"
                ? "border-terracotta bg-terracotta/5 shadow-xs"
                : "border-linen-dark hover:bg-linen/40"
            }`}
          >
            <RadioGroupItem value="erip_invoice" id="pay-erip" className="mt-1" />
            <div>
              <p className="font-medium text-sm text-espresso flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-terracotta" />
                Счёт ЕРИП от мастера
              </p>
              <p className="text-xs text-muted mt-0.5">
                Мастер выставит счёт в ЕРИП вручную после согласования деталей заказа
              </p>
            </div>
          </label>

          <label
            htmlFor="pay-card"
            className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
              paymentMethod === "bank_transfer"
                ? "border-terracotta bg-terracotta/5 shadow-xs"
                : "border-linen-dark hover:bg-linen/40"
            }`}
          >
            <RadioGroupItem value="bank_transfer" id="pay-card" className="mt-1" />
            <div>
              <p className="font-medium text-sm text-espresso flex items-center gap-1.5">
                <Building className="h-4 w-4 text-terracotta" />
                Банковский перевод
              </p>
              <p className="text-xs text-muted mt-0.5">
                Прямой перевод на карточный счёт мастера (Беларусбанк / Альфа-Банк)
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* 4. Комментарий к заказу */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-sm space-y-2">
        <Label htmlFor="cust-comment" className="text-xs text-espresso font-medium">
          Пожелания или комментарий к заказу (необязательно):
        </Label>
        <Textarea
          id="cust-comment"
          rows={3}
          placeholder="Например: кукла в подарок дочке, положите, пожалуйста, открытку с поздравлением..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Honeypot поле (невидимо для человека) */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="hp_field">Оставьте пустым</label>
        <input
          id="hp_field"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Ошибки валидации */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Юридические согласия */}
      <div className="space-y-2.5 text-xs text-muted pt-1">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="pd-consent"
            checked={pdConsent}
            onCheckedChange={(checked) => setPdConsent(Boolean(checked))}
            className="mt-0.5"
          />
          <Label htmlFor="pd-consent" className="text-[11px] leading-relaxed cursor-pointer font-normal">
            Я даю согласие на обработку персональных данных в соответствии с{" "}
            <Link
              href="/politika-konfidencialnosti"
              target="_blank"
              className="text-terracotta underline hover:text-terracotta-hover"
            >
              Политикой конфиденциальности
            </Link>{" "}
            (Закон РБ № 99-З).
          </Label>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="offer-consent"
            checked={offerConsent}
            onCheckedChange={(checked) => setOfferConsent(Boolean(checked))}
            className="mt-0.5"
          />
          <Label htmlFor="offer-consent" className="text-[11px] leading-relaxed cursor-pointer font-normal">
            Я принимаю условия{" "}
            <Link
              href="/oferta"
              target="_blank"
              className="text-terracotta underline hover:text-terracotta-hover"
            >
              Публичной оферты
            </Link>{" "}
            интернет-магазина DollShop.
          </Label>
        </div>
      </div>

      {/* Кнопка отправки */}
      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full text-base py-6 shadow-md hover:shadow-lg transition-all"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Оформляем заказ...
          </>
        ) : (
          <>
            Подтвердить заказ на {formatPrice(dollPriceByn)}
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}
