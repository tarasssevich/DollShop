"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/format";
import { simulateSandboxCardPaymentAction } from "@/actions/payments";

export default function SandboxPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";
  const orderNumber = parseInt(searchParams.get("orderNumber") || "0", 10);
  const amountByn = parseFloat(searchParams.get("amount") || "0");
  const dollTitle = searchParams.get("doll") || "Кукла ручной работы";
  const returnUrl = searchParams.get("returnUrl") || "/";

  // Card Inputs
  const [cardNumber, setCardNumber] = React.useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = React.useState("12/28");
  const [cardCvc, setCardCvc] = React.useState("777");
  const [cardHolder, setCardHolder] = React.useState("DOLL SHOPPER");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [outcome, setOutcome] = React.useState<"success" | "declined">("success");

  const fillQuickCard = (type: "success" | "declined") => {
    if (type === "success") {
      setCardNumber("4242 •••• •••• 4242");
      setOutcome("success");
      toast.info("Заполнена тестовая карта успешной оплаты");
    } else {
      setCardNumber("4000 •••• •••• 0002");
      setOutcome("declined");
      toast.warning("Заполнена карта для симуляции отказа банка");
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error("Не указан идентификатор заказа");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await simulateSandboxCardPaymentAction({
        orderId,
        orderNumber,
        amountByn,
        dollTitle,
        outcome,
      });

      if (res.success) {
        toast.success("Оплата успешно подтверждена!");
        // Редирект на страницу заказа покупателя
        setTimeout(() => {
          router.push(`${returnUrl}?payment=success`);
        }, 800);
      } else {
        toast.error(res.error || "Платёж отклонен банком");
        setIsProcessing(false);
      }
    } catch {
      toast.error("Ошибка при обработке платежа");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    toast.info("Оплата отменена");
    router.push(`${returnUrl}?payment=cancelled`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Индикатор Sandbox-режима */}
        <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs text-amber-900 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            bePaid Sandbox Gateway (Тестовый режим)
          </span>
          <span className="rounded bg-amber-500 text-white font-mono text-[10px] px-1.5 py-0.5">
            TEST MODE
          </span>
        </div>

        {/* Основная карточка платежа */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Шапка платежа */}
          <div className="bg-slate-900 text-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium">DollShop.by</p>
                  <p className="text-sm font-semibold">Оплата заказа #{orderNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">К оплате</p>
                <p className="text-lg font-bold text-amber-400 font-mono">
                  {formatPrice(amountByn)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 truncate pt-1 border-t border-slate-800">
              Товар: <span className="text-white">{dollTitle}</span>
            </p>
          </div>

          {/* Форма ввода карты */}
          <form onSubmit={handlePay} className="p-5 sm:p-6 space-y-4">
            {/* Быстрые кнопки пресетов */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted font-medium uppercase tracking-wider">
                Быстрый выбор тестовой карты:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickCard("success")}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                    outcome === "success"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Успешная оплата
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCard("declined")}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                    outcome === "declined"
                      ? "border-rose-600 bg-rose-50 text-rose-900 font-medium"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Отказ банка
                </button>
              </div>
            </div>

            {/* Номер карты */}
            <div className="space-y-1.5">
              <Label htmlFor="card-num" className="text-xs text-slate-700">
                Номер карты
              </Label>
              <div className="relative">
                <Input
                  id="card-num"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="font-mono text-sm pl-10"
                  required
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Срок и CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-exp" className="text-xs text-slate-700">
                  Срок (ММ/ГГ)
                </Label>
                <Input
                  id="card-exp"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="font-mono text-xs text-center"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-cvc" className="text-xs text-slate-700">
                  CVC / CVV
                </Label>
                <div className="relative">
                  <Input
                    id="card-cvc"
                    type="password"
                    maxLength={3}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="font-mono text-xs text-center pr-8"
                    required
                  />
                  <Lock className="w-3 h-3 text-slate-400 absolute right-2.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Имя держателя */}
            <div className="space-y-1.5">
              <Label htmlFor="card-name" className="text-xs text-slate-700">
                Имя на карте (латиницей)
              </Label>
              <Input
                id="card-name"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase"
                required
              />
            </div>

            {/* Безопасность */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Защищено 256-битным шифрованием по стандарту PCI-DSS</span>
            </div>

            {/* Кнопки */}
            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 h-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Обработка платежа в банке...
                  </>
                ) : (
                  `Оплатить ${formatPrice(amountByn)}`
                )}
              </Button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1.5 transition-colors"
              >
                Отменить и вернуться в магазин
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
