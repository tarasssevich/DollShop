"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ExternalLink } from "lucide-react";
import { signOut } from "@/lib/auth/client";

interface AdminHeaderProps {
  userName?: string;
  userEmail?: string;
}

export function AdminHeader({ userName = "Мастер", userEmail = "master@dollshop.by" }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-linen-dark px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Бренд с логотипом */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-linen-dark/80 bg-white shrink-0 shadow-2xs">
            <Image
              src="/images/logo-128.webp"
              alt="DollShop"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="font-serif text-base font-light text-espresso leading-none block">
              DollShop
            </span>
            <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">
              Панель мастера
            </span>
          </div>
        </div>

        {/* Действия: перейти на витрину + профиль / выход */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть публичную витрину в новой вкладке"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-linen-dark text-xs text-muted hover:text-espresso hover:bg-linen/50 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Витрина</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-linen-dark">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-medium text-espresso block leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-muted block leading-tight">
                {userEmail}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Выйти из кабинета"
              className="p-2 rounded-xl text-muted hover:text-red-700 hover:bg-red-50 transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Выйти из кабинета"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
