import { getAdminRequestsAction } from "@/actions/admin/requests";
import { RequestsClient } from "@/components/admin/RequestsClient";

export const metadata = {
  title: "Заявки «На заказ» · Панель мастера",
};

export const dynamic = "force-dynamic";

export default async function AdminCustomRequestsPage() {
  const result = await getAdminRequestsAction();
  const requests = result.success ? result.requests : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Индивидуальные заявки
        </h1>
        <p className="text-xs text-muted">
          Заявки на изготовление кукол, повтор работ из Галереи и обсуждение с клиентами
        </p>
      </div>

      <RequestsClient initialRequests={requests} />
    </div>
  );
}
