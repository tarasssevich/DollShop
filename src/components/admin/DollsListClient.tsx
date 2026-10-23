"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, ChevronRight, PackageOpen } from "lucide-react";
import type { Doll, DollStatus } from "@/types/domain";

interface DollsListClientProps {
  initialDolls: Doll[];
}

type FilterOption = "all" | DollStatus | "draft";

const STATUS_FILTERS: Array<{ id: FilterOption; label: string }> = [
  { id: "all", label: "Все" },
  { id: "available", label: "🟢 В наличии" },
  { id: "sold", label: "🏡 В архиве" },
  { id: "in_progress", label: "✨ На заказ" },
  { id: "reserved", label: "⏳ Бронь" },
  { id: "draft", label: "📝 Черновики" },
];

export function DollsListClient({ initialDolls }: DollsListClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDolls = useMemo(() => {
    return initialDolls.filter((doll) => {
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
  }, [initialDolls, activeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Заголовок + быстрый поиск */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
            Мои куклы
          </h1>
          <p className="text-xs text-muted">
            Всего в мастерской: {initialDolls.length}{" "}
            {initialDolls.length === 1
              ? "работа"
              : initialDolls.length < 5
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
        {STATUS_FILTERS.map((filter) => {
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

            return (
              <Link
                key={doll.id}
                href={`/admin/kukly/${doll.id}`}
                className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition hover:shadow-sm active:scale-[0.99] ${
                  isDraft
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
