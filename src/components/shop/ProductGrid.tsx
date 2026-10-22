import * as React from "react";
import type { Doll } from "@/types/domain";
import { ProductCard } from "./ProductCard";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  dolls: Doll[];
  emptyMessage?: string;
}

export function ProductGrid({
  dolls,
  emptyMessage = "Куклы в выбранной категории пока отсутствуют",
}: ProductGridProps) {
  if (dolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-linen-dark bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linen text-terracotta mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="font-serif text-2xl font-light text-espresso mb-2">
          {emptyMessage}
        </p>
        <p className="text-xs text-muted max-w-md mb-6 leading-relaxed">
          Каждая кукла создается вручную в единственном экземпляре. Вы можете
          оформить индивидуальный заказ с пожеланиями по росписи и наряду.
        </p>
        <Link href="/na-zakaz">
          <Button variant="default" className="rounded-full">
            Заказать индивидуальную куклу
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
      {dolls.map((doll, index) => (
        <ProductCard key={doll.id} doll={doll} priority={index < 2} />
      ))}
    </div>
  );
}
