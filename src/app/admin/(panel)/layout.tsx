import { requireAdminPage } from "@/lib/auth/guard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminLiveSyncProvider } from "@/components/admin/AdminLiveSyncProvider";

export const metadata = {
  title: "Панель мастера · DollShop",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();

  return (
    <AdminLiveSyncProvider>
      <div className="min-h-screen bg-alabaster text-espresso flex flex-col">
        <AdminHeader
          userName={session.user.name}
          userEmail={session.user.email}
        />
        <main className="flex-1 pb-24 sm:pb-28">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
        <AdminBottomNav />
      </div>
    </AdminLiveSyncProvider>
  );
}
