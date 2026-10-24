"use client";

import * as React from "react";
import { Search, Loader2, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatAsBelarusPhoneInput } from "@/lib/utils/phone";
import {
  findOrdersByPhoneAction,
  type PublicOrderSummary,
} from "@/actions/order";
import { mergeLocalOrders } from "@/lib/data/recent-orders";

interface OrderLookupByPhoneProps {
  onOrdersFound?: (orders: PublicOrderSummary[]) => void;
  className?: string;
}

export function OrderLookupByPhone({
  onOrdersFound,
  className = "",
}: OrderLookupByPhoneProps) {
  const [phone, setPhone] = React.useState("+375 ");
  const [isLoading, setIsLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [foundCount, setFoundCount] = React.useState<number | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAsBelarusPhoneInput(e.target.value);
    setPhone(formatted);
    setSearched(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      toast.error("Пожалуйста, введите полный номер телефона Беларуси (+375...)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await findOrdersByPhoneAction(phone);
      setSearched(true);

      if (res.success) {
        setFoundCount(res.orders.length);
        if (res.orders.length > 0) {
          // Сохраняем в localStorage для быстрого доступа в будущем
          mergeLocalOrders(res.orders);
          toast.success(`Найдено заказов: ${res.orders.length}`, {
            description: "Заказы успешно сохранены на этом устройстве.",
          });
          onOrdersFound?.(res.orders);
        } else {
          toast.info("Заказов по этому номеру не найдено", {
            description: "Проверьте номер телефона или оформите новый заказ в каталоге.",
          });
        }
      } else {
        toast.error(res.error || "Не удалось найти заказы");
      }
    } catch {
      toast.error("Ошибка соединения. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linen border border-linen-dark text-espresso">
          <Phone className="h-4 w-4 text-terracotta" />
        </div>
        <div>
          <h3 className="font-serif text-base sm:text-lg font-medium text-espresso">
            Найти заказ по номеру телефона
          </h3>
          <p className="text-xs text-muted">
            Если вы оформляли покупку с другого устройства или очистили браузер
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+375 (29) 000-00-00"
            className="font-mono text-sm pl-3.5 pr-8 py-2 rounded-xl"
            autoComplete="tel"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl px-5 shadow-2xs shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Поиск...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              <span>Найти заказы</span>
            </>
          )}
        </Button>
      </form>

      {searched && foundCount !== null && (
        <div className="mt-3.5 text-xs text-muted flex items-center gap-1.5">
          {foundCount > 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-espresso font-medium">
                Найдено заказов: {foundCount}. Они отображаются в списке ниже.
              </span>
            </>
          ) : (
            <span className="text-amber-700">
              По номеру {phone} заказов не найдено. Убедитесь, что номер совпадает с указанным при покупке.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
