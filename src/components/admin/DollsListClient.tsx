"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  ChevronRight,
  PackageOpen,
  Clock,
  Unlock,
} from "lucide-react";
import type { Doll, DollStatus } from "@/types/domain";
import { useAdminLiveSync } from "./AdminLiveSyncProvider";

interface DollsListClientProps {
  initialDolls: Doll[];
}

type FilterOption = "all" | DollStatus | "draft";

function DollReservationTimer({
  reservedUntil,
  onRelease,
  dollName,
}: {
  reservedUntil: string | null;
  onRelease: () => void;
  dollName: string;
}) {
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (!reservedUntil) return 0;
    return Math.max(
      0,
      Math.floor((new Date(reservedUntil).getTime() - Date.now()) / 1000)
    );
  });

  useEffect(() => {
    if (!reservedUntil) return;
    const interval = setInterval(() => {
      const sec = Math.max(
        0,
        Math.floor((new Date(reservedUntil).getTime() - Date.now()) / 1000)
      );
      setRemainingSec(sec);
    }, 1000);
    return () => clearInterval(interval);
  }, [reservedUntil]);

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const timeFormatted = `${mm}:${ss < 10 ? "0" : ""}${ss}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-900 text-xs font-medium border border-amber-300 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
        <span>
          {remainingSec > 0
            ? `Забронирована (осталось ${timeFormatted})`
            : "Время брони истекает..."}
        </span>
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRelease();
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition cursor-pointer active:scale-95"
        title={`Снять бронь с куклы «${dollName}» и мгновенно вернуть её на витрину`}
      >
        <Unlock className="w-3.5 h-3.5" />
        <span>Освободить</span>
      </button>
    </div>
  );
}

export function DollsListClient({ initialDolls }: DollsListClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { activeReservations, releaseReservation } = useAdminLiveSync();

  // Создаем быстрый lookup активных броней из live-состояния
  const reservationsByProductId = useMemo(() => {
    const map = new Map<string, (typeof activeReservations)[0]>();
    for (const r of activeReservations) {
      map.set(r.productId, r);
    }
    return map;
  }, [activeReservations]);

  // Объединяем серверные данные кукол с живыми бронями в реальном времени
  const mergedDolls = useMemo(() => {
    return initialDolls.map((doll) => {
      const liveRes = reservationsByProductId.get(doll.id);
      if (liveRes) {
        return {
          ...doll,
          status: "reserved" as DollStatus,
          reservedUntil: liveRes.reservedUntil,
        };
      }
      return doll;
    });
  }, [initialDolls, reservationsByProductId]);

  const reservedCount = useMemo(() => {
    return mergedDolls.filter((d) => d.status === "reserved" && !d.isDraft).length;
  }, [mergedDolls]);

  const statusFilters: Array<{ id: FilterOption; label: string }> = [
    { id: "all", label: "Все" },
    { id: "available", label: "🟢 В наличии" },
    { id: "sold", label: "🏡 В архиве" },
    { id: "in_progress", label: "✨ На заказ" },
    {
      id: "reserved",
      label: reservedCount > 0 ? `⏳ Бронь (${reservedCount})` : "⏳ Бронь",
    },
    { id: "draft", label: "📝 Черновики" },
  ];

  const filteredDolls = useMemo(() => {
    return mergedDolls.filter((doll) => {
      // 1. Фильтр по статусу
      if (activeFilter === "draft") {
        if (!doll.isDraft) return false;
      } else if (activeFilter !== "all") {
        if (doll.isDraft) return false;
        if (doll.status !== activeFilter) return false;
      }

      // 2. Поиск по названию
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = doll.name.toLowerCase().includes(query);
        const matchesCollection = doll.collection?.toLowerCase().includes(query);
        if (!matchesName && !matchesCollection) return false;
      }

      return true;
    });
  }, [mergedDolls, activeFilter, searchQuery]);

  const handleRelease = async (dollId: string, dollName: string) => {
    const confirmed = window.confirm(
      `Снять бронь с куклы «${dollName}»?\n\nКукла сразу вернется в открытую продажу на витрину магазина.`
    );
    if (!confirmed) return;

    await releaseReservation(dollId);
  };

  return (
    <div className="space-y-4">
      {/* Заголовок + быстрый поиск */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
            Мои куклы
          </h1>
          <p className="text-xs text-muted">
            Всего в мастерской: {mergedDolls.length}{" "}
            {mergedDolls.length === 1
              ? "работа"
              : mergedDolls.length < 5
                ? "работы"
                : "работ"}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
          />
        </div>
      </div>

      {/* Горизонтальные чипсы-фильтры под палец */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {statusFilters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition cursor-pointer min-h-[40px] flex items-center font-medium ${
                isActive
                  ? "bg-terracotta text-white shadow-sm"
                  : "bg-white text-muted border border-linen-dark hover:text-espresso hover:border-linen-dark/80"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Список кукол */}
      {filteredDolls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linen-dark p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-linen flex items-center justify-center mx-auto text-muted">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-base text-espresso">
              Куклы не найдены
            </h3>
            <p className="text-xs text-muted max-w-xs mx-auto">
              По выбранному фильтру нет работ. Попробуйте сбросить фильтр или добавить новую куклу.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDolls.map((doll) => {
            const coverImage = doll.images[0]?.url || "/mock/dolls/placeholder.webp";
            const isDraft = doll.isDraft;
            const isReserved = doll.status === "reserved" && !isDraft;

            return (
              <Link
                key={doll.id}
                href={`/admin/kukly/${doll.id}`}
                className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition hover:shadow-sm active:scale-[0.99] ${
                  isReserved
                    ? "border-amber-300 bg-amber-50/30"
                    : isDraft
                      ? "border-dashed border-amber-300 bg-amber-50/20"
                      : "border-linen-dark hover:border-terracotta/40"
                }`}
              >
                {/* Превью 72x72 */}
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-linen shrink-0">
                  <Image
                    src={coverImage}
                    alt={doll.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {isDraft && (
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white leading-none">
                      Черновик
                    </span>
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {doll.status === "available" && (
                      <span className="inline-block w-2 h-2 rounded-full bg-sage shrink-0" />
                    )}
                    {doll.status === "sold" && (
                      <span className="inline-block w-2 h-2 rounded-full bg-muted shrink-0" />
                    )}
                    {doll.status === "reserved" && (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                    {doll.status === "in_progress" && (
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    )}
                    <h2 className="font-serif text-base font-normal text-espresso truncate">
                      {doll.name}
                    </h2>
                  </div>

                  <p className="text-xs text-muted truncate">
                    {doll.collection || "Авторская серия"} · {doll.heightCm} см
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-sm font-semibold text-terracotta">
                      {doll.priceByn} BYN
                    </span>
                    <span className="text-[11px] text-muted">
                      ({doll.images.length}{" "}
                      {doll.images.length === 1
                        ? "фото"
                        : doll.images.length < 5
                          ? "фото"
                          : "фото"}
                      )
                    </span>
                  </div>

                  {/* Живой таймер брони и кнопка прямого освобождения для мастера */}
                  {isReserved && (
                    <DollReservationTimer
                      reservedUntil={doll.reservedUntil}
                      onRelease={() => handleRelease(doll.id, doll.name)}
                      dollName={doll.name}
                    />
                  )}
                </div>

                {/* Стрелочка */}
                <div className="text-muted/60 pr-1 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) «+ Новая кукла» */}
      <Link
        href="/admin/kukly/new"
        className="fixed right-4 bottom-20 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-terracotta text-white font-medium text-sm shadow-lg shadow-terracotta/30 hover:bg-terracotta-dark active:scale-95 transition min-h-[48px] cursor-pointer"
        aria-label="Добавить новую куклу"
      >
        <Plus className="w-5 h-5" />
        <span className="pr-1">Новая кукла</span>
      </Link>
    </div>
  );
}
