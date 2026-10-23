import { getSiteSettings } from "@/lib/data/catalog";
import { SettingsClient } from "@/components/admin/SettingsClient";

export const metadata = {
  title: "Настройки магазина · Панель мастера",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Реквизиты и настройки
        </h1>
        <p className="text-xs text-muted">
          Юридические данные ИП, условия отправки Белпочтой, способы оплаты и контакты
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
