"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type { DollImage } from "@/types/domain";

export interface LightboxProps {
  images: DollImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  dollName: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export function Lightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  dollName,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  // Sync index when initialIndex changes (React official render adjustment pattern)
  const [prevInitialIndex, setPrevInitialIndex] = React.useState(initialIndex);
  if (initialIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialIndex);
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const resetZoom = React.useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = React.useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length, resetZoom]);

  const handleNext = React.useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length, resetZoom]);

  const zoomIn = React.useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, Number((prev + 0.5).toFixed(1))));
  }, []);

  const zoomOut = React.useCallback(() => {
    setScale((prev) => {
      const next = Math.max(MIN_SCALE, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, zoomIn, zoomOut, resetZoom]);

  // Touch gesture state references
  const touchStartRef = React.useRef<{
    x: number;
    y: number;
    time: number;
    dist: number;
    initialScale: number;
    initialPos: { x: number; y: number };
  }>({
    x: 0,
    y: 0,
    time: 0,
    dist: 0,
    initialScale: 1,
    initialPos: { x: 0, y: 0 },
  });

  const lastTapRef = React.useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const mouseDragRef = React.useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  }>({
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  });

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      if (!t1 || !t2) return;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
        time: Date.now(),
        dist,
        initialScale: scale,
        initialPos: { ...position },
      };
      setIsDragging(true);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!touch) return;
      const now = Date.now();
      const lastTap = lastTapRef.current;

      // Double-tap detection (< 300ms, < 25px drift)
      if (
        now - lastTap.time < 300 &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 25
      ) {
        if (scale > 1) {
          resetZoom();
        } else {
          setScale(DOUBLE_TAP_SCALE);
        }
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        return;
      }

      lastTapRef.current = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
      };

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        dist: 0,
        initialScale: scale,
        initialPos: { ...position },
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    // Two finger pinch zoom
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      if (!t1 || !t2) return;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, touchStartRef.current.initialScale * factor)
        );
        setScale(Number(newScale.toFixed(2)));
      }
      return;
    }

    // Single finger pan / swipe
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (scale > 1) {
        // Panning inside zoomed image with bounds
        const maxPanX = (scale - 1) * 180;
        const maxPanY = (scale - 1) * 240;

        const nextX = Math.min(
          maxPanX,
          Math.max(-maxPanX, touchStartRef.current.initialPos.x + deltaX)
        );
        const nextY = Math.min(
          maxPanY,
          Math.max(-maxPanY, touchStartRef.current.initialPos.y + deltaY)
        );

        setPosition({ x: nextX, y: nextY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(false);

    // If was single touch not zoomed, evaluate swipe gesture
    if (scale === 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Horizontal swipe to navigate
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 400) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
        return;
      }

      // Vertical swipe down to close lightbox
      if (deltaY > 100 && deltaTime < 400) {
        onClose();
        return;
      }
    }

    // If scale was pinched below 1, snap back to 1
    if (scale < 1.05) {
      resetZoom();
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(MAX_SCALE, Number((prev + 0.25).toFixed(2))));
    } else {
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Number((prev - 0.25).toFixed(2)));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse dragging when zoomed
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    mouseDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    const deltaX = e.clientX - mouseDragRef.current.startX;
    const deltaY = e.clientY - mouseDragRef.current.startY;

    const maxPanX = (scale - 1) * 220;
    const maxPanY = (scale - 1) * 300;

    setPosition({
      x: Math.min(
        maxPanX,
        Math.max(-maxPanX, mouseDragRef.current.startPos.x + deltaX)
      ),
      y: Math.min(
        maxPanY,
        Math.max(-maxPanY, mouseDragRef.current.startPos.y + deltaY)
      ),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] ?? images[0];
  if (!currentImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Просмотр фото: ${dollName}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white select-none backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top toolbar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-serif text-base sm:text-lg font-light tracking-wide text-white/90 truncate max-w-[200px] sm:max-w-md">
            {dollName}
          </p>
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/80 font-mono">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Zoom controls & close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            aria-label="Уменьшить масштаб"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="hidden sm:inline-block w-12 text-center font-mono text-xs text-white/70">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            aria-label="Увеличить масштаб"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {scale > 1 && (
            <button
              type="button"
              onClick={resetZoom}
              aria-label="Сбросить масштаб"
              title="Сбросить масштаб"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <div className="h-5 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть полноэкранный просмотр"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-red-500/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main image viewport */}
      <div
        className={`relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          style={{
            transform: `scale(${scale}) translate3d(${position.x / scale}px, ${
              position.y / scale
            }px, 0)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          className="relative max-h-[82vh] max-w-[88vw] aspect-[4/5] w-full flex items-center justify-center will-change-transform"
        >
          <Image
            src={currentImage.url}
            alt={currentImage.alt || `${dollName} — фото ${currentIndex + 1}`}
            fill
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={currentImage.blurDataUrl}
            className="object-contain pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Left Arrow (Desktop / Tablet) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Предыдущая фотография"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/15 shadow-lg backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow (Desktop / Tablet) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Следующая фотография"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/15 shadow-lg backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom bar: Thumbnails strip & Gestures hint */}
      <footer className="relative z-10 flex flex-col items-center justify-center gap-2 px-4 py-2 sm:py-3 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        {/* Thumbnails row */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  resetZoom();
                  setCurrentIndex(idx);
                }}
                className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border transition-all ${
                  idx === currentIndex
                    ? "border-terracotta ring-2 ring-terracotta/40 scale-105"
                    : "border-white/20 opacity-50 hover:opacity-90"
                }`}
                aria-label={`Перейти к фото ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Миниатюра ${idx + 1}`}
                  fill
                  sizes="60px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Helpful interaction hint */}
        <p className="text-[11px] text-white/60 tracking-wide text-center">
          <span className="sm:hidden">
            Двойной тап или щипок для зума · Смахните вниз, чтобы закрыть
          </span>
          <span className="hidden sm:inline">
            Стрелки влево/вправо для листания · Колесико мыши для зума · Двойной клик · Esc
          </span>
        </p>
      </footer>
    </div>
  );
}
