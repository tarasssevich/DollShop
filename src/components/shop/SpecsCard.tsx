import * as React from "react";
import {
  Ruler,
  Calendar,
  Gift,
  FileCheck,
  Feather,
  Sparkles,
  Heart,
  Flower2,
} from "lucide-react";
import type { Doll } from "@/types/domain";

interface SpecsCardProps {
  doll: Pick<Doll, "heightCm" | "year" | "materials" | "details">;
  className?: string;
}

export function SpecsCard({ doll, className = "" }: SpecsCardProps) {
  const { heightCm, year, materials, details } = doll;

  return (
    <div
      className={`rounded-2xl border border-linen-dark bg-white p-6 sm:p-7 space-y-6 shadow-sm ${className}`}
    >
      <div>
        <h3 className="font-serif text-2xl font-light text-espresso">
          Характеристики и материалы
        </h3>
        <p className="text-xs text-muted mt-1">
          Каждая деталь изготовлена вручную из натуральных и экологичных материалов.
        </p>
      </div>

      {/* Primary specifications grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-sm divide-y sm:divide-y-0 sm:divide-x-0 divide-linen-dark/60">
        {/* Height */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-terracotta shrink-0">
            <Ruler className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Высота феи:</span>
            <span className="font-medium text-espresso">
              {heightCm} см (без учета петельки)
            </span>
          </div>
        </div>

        {/* Year */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-sage shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Год создания:</span>
            <span className="font-medium text-espresso">{year} г. (OOAK)</span>
          </div>
        </div>

        {/* Head & Face */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-terracotta shrink-0">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Личико:</span>
            <span className="font-medium text-espresso">
              Точёная бусина из светлого бука, ручная роспись
            </span>
          </div>
        </div>

        {/* Hair */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-sage shrink-0">
            <Feather className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Волосы:</span>
            <span className="font-medium text-espresso">
              {details.hairMaterial || "Хлопковая пряжа цвета экрю"}
            </span>
          </div>
        </div>

        {/* Dress */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-terracotta shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Платье:</span>
            <span className="font-medium text-espresso">
              {details.dressMaterial || "Хлопковый шнур макраме и фатин"}
            </span>
          </div>
        </div>

        {/* Wings */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-sage shrink-0">
            <Feather className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Крылышки:</span>
            <span className="font-medium text-espresso">
              {details.wingMaterial || "Резное дерево, ажурная перфорация"}
            </span>
          </div>
        </div>

        {/* Bouquet */}
        <div className="flex items-start gap-3 pt-2 sm:pt-0 sm:col-span-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen text-terracotta shrink-0">
            <Flower2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs text-muted block">Аксессуары в руках:</span>
            <span className="font-medium text-espresso">
              {details.bouquetDetails || "Миниатюрный авторский букетик"}
            </span>
          </div>
        </div>
      </div>

      {/* Materials pills */}
      {materials && materials.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-linen-dark">
          <span className="text-xs text-muted font-medium block">
            Использованные материалы:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {materials.map((mat, i) => (
              <span
                key={i}
                className="inline-block rounded-md bg-linen px-2.5 py-1 text-xs text-espresso-soft"
              >
                {mat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What's included / Package */}
      <div className="rounded-xl bg-alabaster p-4 space-y-2 border border-linen-dark">
        <span className="text-xs font-semibold uppercase tracking-wider text-espresso block">
          В комплекте с феей:
        </span>
        <ul className="space-y-1.5 text-xs text-muted">
          {details.boxIncluded && (
            <li className="flex items-center gap-2 text-espresso">
              <Gift className="h-3.5 w-3.5 text-terracotta" />
              <span>
                Крафтовая подарочная коробка с тишью и атласной лентой
              </span>
            </li>
          )}
          {details.hangingLoopIncluded && (
            <li className="flex items-center gap-2 text-espresso">
              <Sparkles className="h-3.5 w-3.5 text-sage" />
              <span>Шелковистый шнур-петелька для подвешивания</span>
            </li>
          )}
          {details.certificateIncluded && (
            <li className="flex items-center gap-2 text-espresso">
              <FileCheck className="h-3.5 w-3.5 text-terracotta" />
              <span>Авторская открытка-паспорт с подписью мастера</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
