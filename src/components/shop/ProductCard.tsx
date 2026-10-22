"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import type { Doll } from "@/types/domain";
import { formatPrice } from "@/lib/utils/format";
import { getEffectiveDollStatus } from "@/lib/data/catalog";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  doll: Doll;
  priority?: boolean;
}

export function ProductCard({ doll, priority = false }: ProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(false);
  const coverImage = doll.images[0];
  const effectiveStatus = getEffectiveDollStatus(doll);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      toast.success(`«${doll.name}» добавлена в избранное`);
    }
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (effectiveStatus === "available") {
      toast.success(`Бронь куклы «${doll.name}» открыта!`, {
        description: "Перейдите в корзину для подтверждения резерва на 15 минут.",
      });
    } else if (effectiveStatus === "sold") {
      toast.info(`Запрос на повтор куклы «${doll.name}»`, {
        description: "Мастер свяжется с вами для согласования деталей заказа.",
      });
    } else if (effectiveStatus === "in_progress") {
      toast.info(`Предзаказ куклы «${doll.name}»`, {
        description: "Работа находится на стадии завершения. Мы забронируем её за вами.",
      });
    }
  };

  return (
    <article className="group relative flex flex-col rounded-2xl border border-linen-dark/80 bg-white p-3 sm:p-4 shadow-xs transition-all duration-300 hover:border-terracotta/40 hover:shadow-md">
      {/* Visual Image Container */}
      <Link
        href={`/kukly/${doll.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-linen select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        tabIndex={-1}
      >
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.alt || doll.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif italic text-muted text-sm">
            Фото куклы
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <StatusBadge
            status={doll.status}
            reservedUntil={doll.reservedUntil}
            className="shadow-xs backdrop-blur-xs"
          />
        </div>

        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          <Badge
            variant="ooak"
            className="shadow-xs bg-white/95 backdrop-blur-xs text-[11px] px-2 py-0.5"
          >
            OOAK
          </Badge>
          <button
            type="button"
            onClick={handleLike}
            aria-label={isLiked ? "Удалить из избранного" : "В избранное"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-espresso shadow-xs backdrop-blur-xs transition-all hover:bg-white active:scale-95"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isLiked ? "fill-terracotta text-terracotta" : "text-muted"
              }`}
            />
          </button>
        </div>
      </Link>

      {/* Doll Info & Metadata */}
      <div className="flex flex-1 flex-col pt-3.5 space-y-2">
        {doll.collection ? (
          <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
            {doll.collection}
          </p>
        ) : null}

        <h3 className="font-serif text-xl sm:text-2xl font-normal text-espresso leading-snug">
          <Link
            href={`/kukly/${doll.slug}`}
            className="transition-colors group-hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta"
          >
            «{doll.name}»
          </Link>
        </h3>

        <p className="text-xs text-muted leading-relaxed line-clamp-1">
          {doll.heightCm} см · {doll.materials[0] ?? "Фарфор"} ·{" "}
          {doll.details.jointsCount
            ? `${doll.details.jointsCount} шарниров`
            : "Статичная"}
        </p>

        {/* Price & Action Row */}
        <div className="pt-2 mt-auto border-t border-linen-dark/60 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-muted block leading-none">Цена:</span>
            <span className="text-lg sm:text-xl font-semibold text-terracotta font-sans tracking-tight">
              {formatPrice(doll.priceByn)}
            </span>
          </div>

          <div>
            {effectiveStatus === "available" ? (
              <Button
                size="sm"
                variant="default"
                onClick={handleQuickAction}
                className="rounded-full px-3.5 shadow-xs"
              >
                <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                <span>Бронь</span>
              </Button>
            ) : effectiveStatus === "sold" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickAction}
                className="rounded-full px-3 text-xs"
              >
                Повтор
              </Button>
            ) : effectiveStatus === "in_progress" ? (
              <Button
                size="sm"
                variant="subtle"
                onClick={handleQuickAction}
                className="rounded-full px-3 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Предзаказ
              </Button>
            ) : (
              <Link href={`/kukly/${doll.slug}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full px-2.5 text-xs text-muted hover:text-espresso"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
