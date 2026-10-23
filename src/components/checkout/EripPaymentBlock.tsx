"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { simulateSandboxEripPaymentAction } from "@/actions/payments";

interface EripPaymentBlockProps {
  orderId: string;
  orderNumber: number;
  dollTitle: string;
  amountByn: number;
  qrDataUrl: string;
  treeSteps: string[];
  isPaid: boolean;
}

export function EripPaymentBlock({
  orderId,
  orderNumber,
  dollTitle,
  amountByn,
  qrDataUrl,
  treeSteps,
  isPaid,
}: EripPaymentBlockProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [simulatedPaid, setSimulatedPaid] = React.useState(isPaid);
  const [simError, setSimError] = React.useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const res = await simulateSandboxEripPaymentAction({
        orderId,
        orderNumber,
        amountByn,
        dollTitle,
      });

      if (res.success) {
        setSimulatedPaid(true);
        router.refresh();
      } else {
        setSimError(res.error || "Не удалось симулировать оплату");
      }
    } catch {
      setSimError("Сбой подключения к серверу");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-terracotta/20 bg-gradient-to-br from-terracotta/[0.03] to-amber-500/[0.04] p-5 sm:p-7 shadow-xs space-y-6">
      {/* Шапка блока ЕРИП */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terracotta/15 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
              Оплата через систему «Расчет» (ЕРИП)
            </h3>
            <p className="text-xs text-muted">
              Без комиссии в мобильном банкинге любого банка Беларуси
            </p>
          </div>
        </div>

        {simulatedPaid ? (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Оплачено через ЕРИП
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-medium border border-amber-300">
            Ожидает оплаты в ЕРИП
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Левая колонка: QR-код */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white border border-linen-dark shadow-xs space-y-3">
          {qrDataUrl ? (
            <div className="relative h-48 w-48 rounded-lg overflow-hidden border border-linen-dark p-2 bg-white">
              <Image
                src={qrDataUrl}
                alt={`QR-код для оплаты заказа #${orderNumber} в ЕРИП`}
                width={192}
                height={192}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-48 w-48 rounded-lg border border-dashed border-linen-dark flex items-center justify-center text-xs text-muted">
              QR-код формируется...
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-medium text-espresso flex items-center justify-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-terracotta" />
              Отсканируйте в приложении банка
            </p>
            <p className="text-[11px] text-muted leading-tight">
              Беларусбанк, Приорбанк, Альфа-Банк, МТБанк, Сбер Банк и др.
            </p>
          </div>
        </div>

        {/* Правая колонка: Дерево ЕРИП и номер счёта */}
        <div className="md:col-span-7 space-y-4">
          {/* Номер счёта с кнопкой копирования */}
          <div className="p-3.5 rounded-xl bg-white border border-linen-dark flex items-center justify-between gap-3">
            <div>
              <span className="block text-[11px] text-muted">Номер заказа / лицевой счёт:</span>
              <span className="font-mono text-base font-semibold text-espresso tracking-wider">
                {orderNumber}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="rounded-lg h-8 px-2.5 text-xs gap-1 border-linen-dark hover:border-terracotta"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted" />
                  <span>Скопировать</span>
                </>
              )}
            </Button>
          </div>

          {/* Сумма */}
          <div className="p-3.5 rounded-xl bg-white border border-linen-dark flex items-center justify-between">
            <span className="text-xs text-muted">Сумма к оплате:</span>
            <span className="font-sans font-semibold text-base text-terracotta">
              {formatPrice(amountByn)}
            </span>
          </div>

          {/* Путь в дереве ЕРИП */}
          <div className="rounded-xl bg-white/80 border border-linen-dark p-3.5 space-y-2">
            <p className="text-[11px] font-semibold text-espresso uppercase tracking-wider">
              Путь в каталоге ЕРИП:
            </p>
            <div className="space-y-1.5 text-xs">
              {treeSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-muted">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-linen text-[10px] font-mono text-espresso">
                    {idx + 1}
                  </span>
                  <span className={idx === treeSteps.length - 1 ? "font-medium text-espresso" : ""}>
                    {step}
                  </span>
                  {idx < treeSteps.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted/50 ml-auto shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Интерактивная Sandbox-симуляция платежа для демонстрации */}
      {!simulatedPaid && (
        <div className="rounded-xl border border-terracotta/20 bg-white/90 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-espresso">
                Тестирование оплаты онлайн (Sandbox режим)
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                Вы можете проверить сценарий моментальной оплаты прямо сейчас без списания реальных средств.
                При симуляции статус заказа обновится на «Оплачен», а кукла перейдет в Архив.
              </p>
            </div>
          </div>

          {simError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
              {simError}
            </p>
          )}

          <Button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isSimulating}
            className="w-full sm:w-auto rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-xs h-9 px-4 font-medium shadow-xs"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Фиксация платежа ЕРИП...
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                ⚡ Симулировать успешную оплату через ЕРИП
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
