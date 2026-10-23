"use client";

import * as React from "react";
import type { Doll } from "@/types/domain";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductGrid } from "./ProductGrid";
import { Sparkles, Heart, Archive } from "lucide-react";

interface CatalogTabsProps {
  availableDolls: Doll[];
  inProgressDolls: Doll[];
  soldDolls: Doll[];
}

export function CatalogTabs({
  availableDolls,
  inProgressDolls,
  soldDolls,
}: CatalogTabsProps) {
  return (
    <Tabs defaultValue="available" className="w-full space-y-8">
      {/* Scrollable Tabs on mobile for thumb ergonomics */}
      <div className="flex justify-center overflow-x-auto pb-2 scrollbar-none">
        <TabsList className="h-12 rounded-full border border-linen-dark bg-linen/70 p-1.5 shadow-xs">
          <TabsTrigger
            value="available"
            className="flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-terracotta data-[state=active]:shadow-xs"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Ищут дом</span>
            <span className="rounded-full bg-terracotta-subtle px-2 py-0.5 text-[11px] font-semibold text-terracotta">
              {availableDolls.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="in_progress"
            className="flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-espresso data-[state=active]:shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-sage" />
            <span>В процессе</span>
            <span className="rounded-full bg-sage-subtle px-2 py-0.5 text-[11px] font-semibold text-sage">
              {inProgressDolls.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="archive"
            className="flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-muted data-[state=active]:shadow-xs"
          >
            <Archive className="h-3.5 w-3.5 text-muted" />
            <span>Архив</span>
            <span className="rounded-full bg-linen px-2 py-0.5 text-[11px] font-medium text-muted">
              {soldDolls.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab 1: Available dolls */}
      <TabsContent value="available" className="space-y-4 focus-visible:outline-none">
        <div className="text-center pb-2">
          <p className="text-xs text-muted">
            Куклы готовы к отправке почтой или самовывозу в Минске
          </p>
        </div>
        <ProductGrid
          dolls={availableDolls}
          emptyMessage="Все куклы из текущей коллекции уже нашли свой дом"
        />
      </TabsContent>

      {/* Tab 2: In progress dolls */}
      <TabsContent value="in_progress" className="space-y-4 focus-visible:outline-none">
        <div className="text-center pb-2">
          <p className="text-xs text-muted">
            Работы на стадии финальной росписи и пошива нарядов. Доступны для ранней брони
          </p>
        </div>
        <ProductGrid
          dolls={inProgressDolls}
          emptyMessage="Сейчас все начатые куклы завершены и перенесены в основной каталог"
        />
      </TabsContent>

      {/* Tab 3: Sold / Archive dolls */}
      <TabsContent value="archive" className="space-y-4 focus-visible:outline-none">
        <div className="text-center pb-2">
          <p className="text-xs text-muted">
            Шедевры, находящиеся в частных собраниях. Вы можете заказать похожую работу
          </p>
        </div>
        <ProductGrid
          dolls={soldDolls}
          emptyMessage="Архив пока пуст"
        />
      </TabsContent>
    </Tabs>
  );
}
