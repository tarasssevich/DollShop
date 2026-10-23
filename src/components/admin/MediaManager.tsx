"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Star,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { uploadDollImage, type UploadProgressEvent } from "@/lib/images/upload";
import {
  deleteProductMediaAction,
  reorderProductMediaAction,
} from "@/actions/admin/media";

export interface MediaItem {
  id: string;
  url: string;
  blurDataUrl?: string | null;
  displayOrder: number;
  alt?: string | null;
}

interface UploadingState {
  tempId: string;
  name: string;
  progress: number;
  message: string;
  error?: string;
}

export interface MediaManagerProps {
  productId?: string;
  onEnsureProductId?: () => Promise<string>;
  dollTitle: string;
  initialMedia?: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
}

export function MediaManager({
  productId: initialProductId,
  onEnsureProductId,
  dollTitle,
  initialMedia = [],
  onChange,
}: MediaManagerProps) {
  const [activeProductId, setActiveProductId] = useState<string | undefined>(
    initialProductId
  );
  const [mediaList, setMediaList] = useState<MediaItem[]>(
    [...initialMedia].sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [uploadingQueue, setUploadingQueue] = useState<UploadingState[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateList = (newList: MediaItem[]) => {
    setMediaList(newList);
    onChange?.(newList);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    // Сразу считываем файлы в постоянный массив, не полагаясь на очистку input
    const fileArray = Array.from(rawFiles);

    let targetProductId = activeProductId;
    if (!targetProductId && onEnsureProductId) {
      try {
        targetProductId = await onEnsureProductId();
        setActiveProductId(targetProductId);
      } catch (err) {
        console.error("Ошибка инициализации куклы перед загрузкой:", err);
        toast.error("Не удалось инициализировать куклу перед загрузкой фото");
        return;
      }
    }

    if (!targetProductId) {
      toast.error("Пожалуйста, укажите название куклы перед загрузкой фото");
      return;
    }

    // Поддержка одновременного выбора до 10 фотографий
    const MAX_BATCH_COUNT = 10;
    const batch = fileArray.slice(0, MAX_BATCH_COUNT);
    if (fileArray.length > MAX_BATCH_COUNT) {
      toast.info(
        `Выбрано ${fileArray.length} файлов. Будут загружены первые ${MAX_BATCH_COUNT}.`
      );
    }

    // 1. Мгновенно отображаем карточки всех выбранных фото в очереди интерфейса
    const initialQueueItems: UploadingState[] = batch.map((file, idx) => ({
      tempId: `temp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      progress: 5,
      message: idx < 2 ? "Подготовка файла..." : "В очереди...",
    }));

    setUploadingQueue((prev) => [...prev, ...initialQueueItems]);

    const baseDisplayOrder = mediaList.length;

    // Пул задач с управляемой параллельностью (2 параллельных потока для стабильности памяти на мобильных браузерах)
    const CONCURRENCY = 2;
    let currentIndex = 0;

    const processNext = async () => {
      while (currentIndex < batch.length) {
        const index = currentIndex++;
        const file = batch[index];
        const queueItem = initialQueueItems[index];
        if (!file || !queueItem) continue;

        const { tempId } = queueItem;
        const currentOrder = baseDisplayOrder + index;

        try {
          const savedMedia = await uploadDollImage({
            file,
            productId: targetProductId,
            alt: dollTitle ? `Кукла ручной работы «${dollTitle}»` : file.name,
            displayOrder: currentOrder,
            onProgress: (ev: UploadProgressEvent) => {
              setUploadingQueue((prev) =>
                prev.map((item) =>
                  item.tempId === tempId
                    ? { ...item, progress: ev.percent, message: ev.message }
                    : item
                )
              );
            },
          });

          // Добавляем сохраненное фото в список
          const newItem: MediaItem = {
            id: savedMedia.id,
            url: savedMedia.url,
            blurDataUrl: savedMedia.blurDataUrl,
            displayOrder: savedMedia.displayOrder,
            alt: savedMedia.alt,
          };

          setMediaList((prev) => {
            const updated = [...prev, newItem].sort(
              (a, b) => a.displayOrder - b.displayOrder
            );
            onChange?.(updated);
            return updated;
          });

          // Убираем из очереди загрузки
          setUploadingQueue((prev) => prev.filter((item) => item.tempId !== tempId));
        } catch (err) {
          const errorText =
            err instanceof Error ? err.message : "Ошибка при загрузке";
          toast.error(`Ошибка при загрузке «${file.name}»: ${errorText}`);
          setUploadingQueue((prev) =>
            prev.map((item) =>
              item.tempId === tempId
                ? { ...item, error: errorText, message: "Ошибка" }
                : item
            )
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, batch.length) },
      () => processNext()
    );
    await Promise.all(workers);
  };

  // Назначение обложки (ставит фото первым с displayOrder = 0)
  const handleMakeCover = (index: number) => {
    if (index === 0 || index >= mediaList.length) return;

    const targetItem = mediaList[index];
    if (!targetItem) return;

    const rest = mediaList.filter((_, i) => i !== index);
    const reordered = [targetItem, ...rest].map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    updateList(reordered);

    startTransition(async () => {
      if (!activeProductId) return;
      await reorderProductMediaAction({
        productId: activeProductId,
        mediaIds: reordered.map((m) => m.id),
      });
    });
  };

  // Перемещение фото влево (ближе к обложке)
  const handleMoveLeft = (index: number) => {
    if (index <= 0 || index >= mediaList.length) return;

    const reordered = [...mediaList];
    const current = reordered[index];
    const prev = reordered[index - 1];

    if (!current || !prev) return;

    reordered[index - 1] = current;
    reordered[index] = prev;

    const normalized = reordered.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    updateList(normalized);

    startTransition(async () => {
      if (!activeProductId) return;
      await reorderProductMediaAction({
        productId: activeProductId,
        mediaIds: normalized.map((m) => m.id),
      });
    });
  };

  // Перемещение фото вправо
  const handleMoveRight = (index: number) => {
    if (index < 0 || index >= mediaList.length - 1) return;

    const reordered = [...mediaList];
    const current = reordered[index];
    const next = reordered[index + 1];

    if (!current || !next) return;

    reordered[index + 1] = current;
    reordered[index] = next;

    const normalized = reordered.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    updateList(normalized);

    startTransition(async () => {
      if (!activeProductId) return;
      await reorderProductMediaAction({
        productId: activeProductId,
        mediaIds: normalized.map((m) => m.id),
      });
    });
  };

  // Удаление фотографии
  const handleDeletePhoto = (id: string, index: number) => {
    const confirmed = window.confirm(
      index === 0
        ? "Удалить главное фото куклы? Следующая фотография автоматически станет обложкой."
        : "Удалить эту фотографию куклы?"
    );
    if (!confirmed) return;

    const filtered = mediaList
      .filter((item) => item.id !== id)
      .map((item, idx) => ({
        ...item,
        displayOrder: idx,
      }));

    updateList(filtered);

    startTransition(async () => {
      if (!activeProductId) return;
      await deleteProductMediaAction({ id, productId: activeProductId });
    });
  };

  return (
    <div className="space-y-4">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-stone-800">
            Фотографии куклы
          </label>
          <p className="text-xs text-stone-500 mt-0.5">
            Первое фото станет обложкой на витрине. Управляйте порядком кнопками ◀ и ▶
          </p>
        </div>
        {mediaList.length > 0 && (
          <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
            {mediaList.length} фото
          </span>
        )}
      </div>

      {/* Скрытый нативный input для камеры / галереи */}
      <input
        type="file"
        ref={fileInputRef}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={handleFilesSelected}
        multiple
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
      />

      {/* Сетка фотографий */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {mediaList.map((item, index) => {
          const isCover = index === 0;

          return (
            <div
              key={item.id}
              className={`relative flex flex-col rounded-2xl overflow-hidden border bg-white transition-all shadow-sm ${
                isCover
                  ? "border-[#9A5B42] ring-2 ring-[#9A5B42]/20"
                  : "border-stone-200"
              }`}
            >
              {/* Превью картинки */}
              <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                <Image
                  src={item.url}
                  alt={item.alt || dollTitle || "Фото куклы"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  placeholder={item.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={item.blurDataUrl || undefined}
                />

                {/* Бейдж обложки */}
                {isCover && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#9A5B42] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Обложка</span>
                  </div>
                )}
              </div>

              {/* Тактильная панель управления без Drag-and-Drop */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50/90 border-t border-stone-200">
                {/* Стрелка влево */}
                <button
                  type="button"
                  onClick={() => handleMoveLeft(index)}
                  disabled={index === 0 || isPending}
                  aria-label="Сдвинуть влево"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Сделать обложкой / Индикатор */}
                {!isCover ? (
                  <button
                    type="button"
                    onClick={() => handleMakeCover(index)}
                    disabled={isPending}
                    aria-label="Сделать обложкой"
                    className="h-10 px-2 flex items-center gap-1 rounded-xl text-xs font-medium text-[#9A5B42] hover:bg-[#9A5B42]/10 active:scale-95 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    <span className="hidden sm:inline">Сделать главной</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-medium text-stone-500 px-2">
                    Главная
                  </div>
                )}

                {/* Стрелка вправо */}
                <button
                  type="button"
                  onClick={() => handleMoveRight(index)}
                  disabled={index === mediaList.length - 1 || isPending}
                  aria-label="Сдвинуть вправо"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(item.id, index)}
                  disabled={isPending}
                  aria-label="Удалить фотографию"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-red-600 hover:bg-red-50 active:scale-95 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Элементы в процессе загрузки */}
        {uploadingQueue.map((item) => (
          <div
            key={item.tempId}
            className="relative flex flex-col justify-center items-center aspect-square rounded-2xl border-2 border-dashed border-[#9A5B42]/40 bg-[#9A5B42]/5 p-4 text-center"
          >
            {item.error ? (
              <div className="space-y-1">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs font-medium text-red-600">{item.error}</p>
                <button
                  type="button"
                  onClick={() =>
                    setUploadingQueue((prev) =>
                      prev.filter((u) => u.tempId !== item.tempId)
                    )
                  }
                  className="text-[11px] text-stone-500 underline mt-1"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <Loader2 className="w-7 h-7 text-[#9A5B42] animate-spin mx-auto" />
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#9A5B42] h-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-[11px] font-medium text-stone-600">
                  {item.message}
                </p>
                <p className="text-[10px] text-stone-400 truncate max-w-[120px] mx-auto">
                  {item.name}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Кнопка добавления нового фото */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#9A5B42] hover:bg-[#9A5B42]/5 text-stone-600 hover:text-[#9A5B42] active:scale-98 transition-all min-h-[140px]"
        >
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-2 text-stone-500 group-hover:text-[#9A5B42]">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Добавить фото</span>
          <span className="text-[10px] text-stone-400 mt-0.5">
            До 10 фото за раз
          </span>
        </button>
      </div>

      {/* Быстрая подсказка для мастера */}
      <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
        <Upload className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          Можно загружать до 10 фото сразу. Фотографии автоматически сжимаются в формат WebP без потери качества
        </span>
      </div>
    </div>
  );
}
