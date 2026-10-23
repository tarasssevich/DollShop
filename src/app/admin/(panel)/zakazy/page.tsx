import { getAdminOrdersAction } from "@/actions/admin/orders";
import { OrdersClient } from "@/components/admin/OrdersClient";

export const metadata = {
  title: "Заказы покупателей · Панель мастера",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const result = await getAdminOrdersAction();
  const orders = result.success ? result.orders : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Заказы покупателей
        </h1>
        <p className="text-xs text-muted">
          Управление заказами: почта (Белпочта), самовывоз в Минске, статусы брони и трек-номера
        </p>
      </div>

      <OrdersClient initialOrders={orders} />
    </div>
  );
}
