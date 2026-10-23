import { getSiteSettings } from "@/lib/data/catalog";
import { SlidersHorizontal, ShieldCheck, Truck, Phone, Mail } from "lucide-react";

export const metadata = {
  title: "Настройки магазина · Панель мастера",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Реквизиты и настройки
        </h1>
        <p className="text-xs text-muted">
          Юридические данные ИП, условия доставки и режим работы магазина
        </p>
      </div>

      <div className="space-y-4">
        {/* Реквизиты */}
        <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-terracotta">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-serif text-base text-espresso">Реквизиты ИП</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">Продавец:</span>
              <span className="font-medium text-espresso">{settings.legalSellerName}</span>
            </div>
            <div>
              <span className="text-muted block">УНП:</span>
              <span className="font-medium text-espresso">{settings.legalUnp}</span>
            </div>
            <div>
              <span className="text-muted block">Торговый реестр РБ:</span>
              <span className="font-medium text-espresso">{settings.legalTradeRegistryNum}</span>
            </div>
            <div>
              <span className="text-muted block">Юридический адрес:</span>
              <span className="font-medium text-espresso">{settings.legalAddress}</span>
            </div>
          </div>
        </div>

        {/* Доставка */}
        <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sage">
            <Truck className="w-5 h-5" />
            <h2 className="font-serif text-base text-espresso">Условия доставки Европочтой</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted block">До отделения:</span>
              <span className="font-medium text-espresso">{settings.deliveryCostBranch} BYN</span>
            </div>
            <div>
              <span className="text-muted block">Курьером до двери:</span>
              <span className="font-medium text-espresso">{settings.deliveryCostCourier} BYN</span>
            </div>
            <div>
              <span className="text-muted block">Бесплатная доставка от:</span>
              <span className="font-medium text-espresso">{settings.freeDeliveryThreshold} BYN</span>
            </div>
          </div>
        </div>

        {/* Контакты */}
        <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-espresso">
            <SlidersHorizontal className="w-5 h-5" />
            <h2 className="font-serif text-base text-espresso">Контакты для покупателей</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted" />
              <span className="font-medium text-espresso">{settings.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted" />
              <span className="font-medium text-espresso">{settings.contactEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
