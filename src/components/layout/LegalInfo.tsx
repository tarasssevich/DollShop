import * as React from "react";
import { Building2, Phone, Mail, Clock, MapPin, Scale } from "lucide-react";

interface LegalInfoProps {
  className?: string;
  variant?: "full" | "compact";
}

/**
 * Standard legal entity requisites required by Edict No. 60 and Belarus Trade Register.
 */
export function LegalInfo({
  className = "",
  variant = "full",
}: LegalInfoProps) {
  if (variant === "compact") {
    return (
      <div className={`space-y-1 text-xs text-muted ${className}`}>
        <p className="font-medium text-espresso">
          ИП Прокопенко Алёна Васильевна
        </p>
        <p>УНП: 193758204 · Минск, Беларусь</p>
        <p>Торговый реестр РБ: № 584920 от 12.03.2024</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-linen-dark bg-white p-6 sm:p-7 space-y-4 text-xs text-muted leading-relaxed ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-linen-dark pb-3">
        <Building2 className="h-4 w-4 text-terracotta" />
        <h4 className="font-serif text-base font-medium text-espresso">
          Официальные реквизиты продавца (Республика Беларусь)
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
            Продавец
          </span>
          <p className="font-medium text-espresso">
            Индивидуальный предприниматель Прокопенко Алёна Васильевна
          </p>
          <p>УНП: 193758204</p>
          <p>
            Свидетельство о гос. регистрации выдано Минским горисполкомом
            15.01.2024 г.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
            Торговый реестр РБ
          </span>
          <p>Регистрационный номер: <strong>№ 584920</strong></p>
          <p>Дата внесения в Торговый реестр: 12 марта 2024 г.</p>
          <p className="flex items-center gap-1.5 pt-1">
            <Scale className="h-3.5 w-3.5 text-sage shrink-0" />
            <span>Орган защиты прав потребителей: Администрация Ленинского р-на г. Минска</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
            Адрес для корреспонденции
          </span>
          <p className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0 mt-0.5" />
            <span>220030, Республика Беларусь, г. Минск, ул. Ленина, д. 14</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
            Контакты и режим работы
          </span>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-sage shrink-0" />
            <span>+375 (29) 123-45-67</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-terracotta shrink-0" />
            <span>info@dollshop.by</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
            <span>Сайт: 24/7. Обработка заказов: Пн–Сб 10:00–20:00</span>
          </p>
        </div>
      </div>
    </div>
  );
}
