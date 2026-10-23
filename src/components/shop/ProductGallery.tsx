"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shop/StatusBadge";
import { Lightbox } from "@/components/shop/Lightbox";
import type { DollImage, DollStatus } from "@/types/domain";

interface ProductGalleryProps {
  images: DollImage[];
  dollName: string;
  status: DollStatus;
  reservedUntil?: string | null;
}

export function ProductGallery({
  images,
  dollName,
  status,
  reservedUntil = null,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const firstImage = images[0];
  if (!firstImage) {
    return (
      <div className="aspect-[4/5] w-full rounded-2xl border border-linen-dark bg-linen/50 flex items-center justify-center text-muted text-sm">
        Фотография готовится
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? firstImage;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main image container */}
      <div
        onClick={() => setIsZoomed(true)}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-linen-dark bg-alabaster shadow-sm group cursor-pointer"
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || `${dollName} — фото ${activeIndex + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 550px"
          priority
          placeholder="blur"
          blurDataURL={activeImage.blurDataUrl}
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Top Badges overlay */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <StatusBadge status={status} reservedUntil={reservedUntil} />
          </div>

          <Badge variant="ooak" className="pointer-events-auto shadow-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Единственный экземпляр
          </Badge>
        </div>

        {/* Navigation arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Предыдущее фото"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-linen-dark text-espresso flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm focus:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Следующее фото"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-linen-dark text-espresso flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm focus:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Bottom Zoom & counter cues */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
          {images.length > 1 ? (
            <span className="rounded-full bg-black/50 text-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium pointer-events-auto">
              {activeIndex + 1} / {images.length}
            </span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-white/90 text-espresso px-3 py-1 text-xs shadow-sm border border-linen-dark hover:bg-white transition-colors pointer-events-auto"
          >
            <ZoomIn className="h-3.5 w-3.5 text-terracotta" />
            <span>Рассмотреть детали</span>
          </button>
        </div>
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                idx === activeIndex
                  ? "border-terracotta ring-2 ring-terracotta/30"
                  : "border-linen-dark opacity-70 hover:opacity-100"
              }`}
              aria-label={`Переключить на фото ${idx + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${dollName} — миниатюра ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* High-End Studio Lightbox with Touch & Keyboard gestures */}
      {isZoomed && (
        <Lightbox
          images={images}
          initialIndex={activeIndex}
          isOpen={isZoomed}
          onClose={() => setIsZoomed(false)}
          dollName={dollName}
        />
      )}
    </div>
  );
}
