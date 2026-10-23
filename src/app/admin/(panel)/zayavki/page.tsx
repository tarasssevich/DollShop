import { MessageSquareHeart } from "lucide-react";

export const metadata = {
  title: "Заявки «На заказ» · Панель мастера",
};

export default function AdminCustomRequestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Индивидуальные заявки
        </h1>
        <p className="text-xs text-muted">
          Пожелания и заявки на повтор работ от покупателей (Фаза 5)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-linen-dark p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-linen flex items-center justify-center mx-auto text-muted">
          <MessageSquareHeart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-base text-espresso">
            Заявки с модального окна витрины
          </h2>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Здесь будут отображаться заявки «Хочу похожую» с контактами в Telegram/Viber и пожеланиями клиентов.
          </p>
        </div>
      </div>
    </div>
  );
}
