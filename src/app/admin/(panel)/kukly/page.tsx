import { getDolls } from "@/lib/data/catalog";
import { DollsListClient } from "@/components/admin/DollsListClient";

export const metadata = {
  title: "Мои куклы · Панель мастера",
};

export default async function AdminDollsPage() {
  const dolls = await getDolls({ includeDrafts: true });

  return <DollsListClient initialDolls={dolls} />;
}
