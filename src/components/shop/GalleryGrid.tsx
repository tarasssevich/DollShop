"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ZoomIn,
  ArrowRight,
  Quote,
  Feather,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/shop/Lightbox";
import type { Doll, DollCategory } from "@/types/domain";

interface GalleryGridProps {
  dolls: Doll[];
  emptyMessage?: string;
}

type FilterCategory = "all" | DollCategory;

const CATEGORIES: { label: string; value: FilterCategory }[] = [
  { label: "Все произведения", value: "all" },
  { label: "Цветочные феи", value: "fairies" },
  { label: "Ангелы-хранители", value: "angels" },
  { label: "Миниатюры", value: "miniatures" },
];

export function GalleryGrid({
  dolls,
  emptyMessage = "В этом разделе пока нет работ",
}: GalleryGridProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<FilterCategory>("all");

  // Lightbox state for examining artwork
  const [lightboxDoll, setLightboxDoll] = React.useState<Doll | null>(null);

  const dollsWithPhotos = React.useMemo(
    () =>
      dolls.filter(
        (d) =>
          Array.isArray(d.images) &&
          d.images.length > 0 &&
          Boolean(d.images[0]?.url)
      ),
    [dolls]
  );

  const filteredDolls = React.useMemo(() => {
    if (selectedCategory === "all") return dollsWithPhotos;
    return dollsWithPhotos.filter((d) => d.category === selectedCategory);
  }, [dollsWithPhotos, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-linen-dark pb-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            const count =
              cat.value === "all"
                ? dolls.length
                : dolls.filter((d) => d.category === cat.value).length;

            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-espresso text-white shadow-xs"
                    : "bg-linen text-muted hover:bg-linen-dark hover:text-espresso"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-black/5 text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted font-sans hidden sm:block">
          Нажмите на фото для детального рассмотрения
        </p>
      </div>

      {/* Editorial Masonry Grid */}
      {filteredDolls.length === 0 ? (
        <div className="rounded-2xl border border-linen-dark bg-white p-12 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredDolls.map((doll, index) => {
            const coverImage =
              doll.images.find((img) => img.isCover) ?? doll.images[0];
            const hasMultiplePhotos = doll.images.length > 1;

            return (
              <article
                key={doll.id}
                className="break-inside-avoid rounded-2xl border border-linen-dark bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col"
              >
                {/* Photo Area */}
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-alabaster cursor-pointer"
                  onClick={() => setLightboxDoll(doll)}
                >
                  {coverImage ? (
                    <Image
                      src={coverImage.url}
                      alt={coverImage.alt || doll.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      priority={index < 2}
                      placeholder="blur"
                      blurDataURL={coverImage.blurDataUrl}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                      Фото готовится
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <Badge variant="sold" className="shadow-xs">
                      В частной коллекции
                    </Badge>

                    <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-espresso shadow-xs">
                      {doll.year} г.
                    </span>
                  </div>

                  {/* Hover Overlay with Quick Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between gap-2 text-white">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxDoll(doll);
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-white/90 text-espresso px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white transition-colors"
                      >
                        <ZoomIn className="h-3.5 w-3.5 text-terracotta" />
                        <span>Рассмотреть {hasMultiplePhotos ? `(все ${doll.images.length} фото)` : ""}</span>
                      </button>

                      <span className="text-[11px] text-white/80 font-serif italic">
                        {doll.heightCm} см
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content Area */}
                <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{doll.collection || "Архивное произведение"}</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Feather className="h-3 w-3 text-sage" />
                        100% OOAK
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-light text-espresso leading-snug group-hover:text-terracotta transition-colors">
                      <Link href={`/kukly/${doll.slug}`}>
                        {doll.name}
                      </Link>
                    </h3>

                    {doll.story && (
                      <p className="font-serif italic text-xs text-espresso-soft leading-relaxed line-clamp-2">
                        <Quote className="inline h-2.5 w-2.5 text-terracotta mr-1 fill-terracotta/20" />
                        «{doll.story}»
                      </p>
                    )}

                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {doll.description}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-linen-dark flex items-center gap-2">
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Link href={`/na-zakaz?from=${doll.slug}`}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Хочу похожую
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs px-3"
                    >
                      <Link
                        href={`/kukly/${doll.slug}`}
                        title="Подробнее о кукле"
                      >
                        <span>Детали</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxDoll && (
        <Lightbox
          images={lightboxDoll.images}
          isOpen={!!lightboxDoll}
          onClose={() => setLightboxDoll(null)}
          dollName={lightboxDoll.name}
        />
      )}
    </div>
  );
}
