import { ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Заказы покупателей · Панель мастера",
};

export default function AdminOrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Заказы покупателей
        </h1>
        <p className="text-xs text-muted">
          История и управление отправлениями Европочтой (Фаза 5)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-linen-dark p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-linen flex items-center justify-center mx-auto text-muted">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-base text-espresso">
            Раздел чекаута и заказов
          </h2>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Здесь будут появляться заказы с отделениями Европочты, телефонами и статусами оплаты. Настройка чекаута — в Фазе 5.
          </p>
        </div>
      </div>
    </div>
  );
}
