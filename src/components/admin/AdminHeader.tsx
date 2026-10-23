"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ExternalLink, RefreshCw, Radio } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { useAdminLiveSync } from "./AdminLiveSyncProvider";

interface AdminHeaderProps {
  userName?: string;
  userEmail?: string;
}

export function AdminHeader({
  userName = "Мастер",
  userEmail = "master@dollshop.by",
}: AdminHeaderProps) {
  const router = useRouter();
  const { isSyncing, triggerSync, activeReservations } = useAdminLiveSync();

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
        {/* Бренд с логотипом и Live-индикатором */}
        <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-light text-espresso leading-none block">
                DollShop
              </span>
              {/* Пульсирующий индикатор живой связи с витриной */}
              <span
                className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                title="Живая двусторонняя связь с витриной активна (автосинхронизация каждые 3 сек)"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Live</span>
              </span>
            </div>
            <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">
              Панель мастера
            </span>
          </div>
        </div>

        {/* Действия: кнопка синхронизации, брони, витрина и выход */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Индикатор активных броней у покупателей прямо в шапке */}
          {activeReservations.length > 0 && (
            <Link
              href="/admin/kukly"
              title={`Сейчас покупателями забронировано кукол: ${activeReservations.length}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium animate-pulse"
            >
              <Radio className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {activeReservations.length}{" "}
                {activeReservations.length === 1 ? "в брони" : "в брони"}
              </span>
            </Link>
          )}

          {/* Кнопка ручной синхронизации */}
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            title="Синхронизировать состояние с витриной сейчас"
            className="p-2 rounded-xl text-muted hover:text-espresso hover:bg-linen/60 transition min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer disabled:opacity-50"
            aria-label="Синхронизировать данные"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-terracotta" : ""}`}
            />
          </button>

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
              className="p-2 rounded-xl text-muted hover:text-red-700 hover:bg-red-50 transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
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
