"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  Sparkles,
} from "lucide-react";
import { MaterialChips } from "./MaterialChips";
import { MediaManager, type MediaItem } from "./MediaManager";
import { AiStoryButton } from "./AiStoryButton";
import { saveProductAction, deleteProductAction, type ProductFormInput } from "@/actions/admin/products";
import type { Doll } from "@/types/domain";

interface ProductFormProps {
  initialDoll?: Doll | null;
  customRequestId?: string;
  customerName?: string;
  referenceDollTitle?: string;
  onSuccess?: (doll: { id: string; slug: string; title: string }) => void;
  onCancel?: () => void;
}

export function ProductForm({
  initialDoll,
  customRequestId,
  customerName,
  referenceDollTitle,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const router = useRouter();
  const isCustomMode = Boolean(customRequestId || initialDoll?.isCustomOrder);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(
    initialDoll?.id
  );
  const isEditing = Boolean(currentProductId);
  const localStorageKey = isCustomMode
    ? `dollshop_custom_req_${customRequestId || "edit"}`
    : `dollshop_draft_form_${currentProductId || "new"}`;

  // Form states
  const [title, setTitle] = useState(
    initialDoll?.name ||
      (isCustomMode
        ? referenceDollTitle
          ? `${referenceDollTitle} (для ${customerName?.split(" ")[0] || "заказчика"})`
          : customerName
          ? `Кукла для ${customerName.split(" ")[0]}`
          : "Индивидуальная кукла"
        : "")
  );
  const [story, setStory] = useState(initialDoll?.story || "");
  const [price, setPrice] = useState<string>(
    initialDoll?.priceByn
      ? String(initialDoll.priceByn)
      : isCustomMode
      ? "65.00"
      : ""
  );
  const [heightCm, setHeightCm] = useState<string>(
    initialDoll?.heightCm ? String(initialDoll.heightCm) : "20"
  );
  const [collection, setCollection] = useState(
    initialDoll?.collection || (isCustomMode ? "Индивидуальный заказ" : "Времена года")
  );
  const [materials, setMaterials] = useState<string[]>(
    initialDoll?.materials || ["Эко-хлопок макраме", "Резное дерево", "Фатин с ромашками"]
  );
  const [status, setStatus] = useState<"available" | "sold" | "made_to_order" | "draft">(
    initialDoll?.isDraft ? "draft" : (initialDoll?.status as "available" | "sold" | "made_to_order") || "available"
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    isCustomMode ? false : (initialDoll?.isFeatured ?? false)
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Проверка наличия сохраненного черновика в localStorage (отложенно)
  useEffect(() => {
    if (typeof window === "undefined" || isEditing) return;
    const timer = setTimeout(() => {
      if (localStorage.getItem(localStorageKey)) {
        setHasSavedDraft(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isEditing, localStorageKey]);

  const restoreDraft = () => {
    if (typeof window === "undefined") return;
    const savedDraft = localStorage.getItem(localStorageKey);
    if (!savedDraft) return;
    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.story) setStory(parsed.story);
      if (parsed.price) setPrice(parsed.price);
      if (parsed.heightCm) setHeightCm(parsed.heightCm);
      if (parsed.materials) setMaterials(parsed.materials);
      setHasSavedDraft(false);
    } catch {
      localStorage.removeItem(localStorageKey);
      setHasSavedDraft(false);
    }
  };

  const discardDraft = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(localStorageKey);
    setHasSavedDraft(false);
  };

  const initialMediaItems: MediaItem[] = (initialDoll?.images || []).map(
    (img, index) => ({
      id: img.id,
      url: img.url,
      blurDataUrl: img.blurDataUrl,
      displayOrder: index,
      alt: img.alt,
    })
  );

  const ensureProductId = async (): Promise<string> => {
    if (currentProductId) return currentProductId;

    const draftTitle = title.trim() || (isCustomMode ? "Кукла на заказ" : "Новая кукла");
    const draftPayload: ProductFormInput = {
      title: draftTitle,
      story: story.trim() || (isCustomMode ? "Черновик описания куклы на заказ" : "Черновик описания"),
      price: parseFloat(price.replace(",", ".")) || (isCustomMode ? 65 : 100),
      heightCm: parseInt(heightCm, 10) || 20,
      collection: collection.trim() || (isCustomMode ? "Индивидуальный заказ" : "Авторская серия"),
      materials: materials.length > 0 ? materials : ["Эко-хлопок макраме"],
      status: "draft",
      isFeatured: false,
      isCustomOrder: isCustomMode || Boolean(initialDoll?.isCustomOrder),
      customRequestId: customRequestId || initialDoll?.customRequestId || null,
    };

    const res = await saveProductAction(draftPayload);
    if (!res.success) {
      throw new Error(res.error || "Не удалось создать черновик куклы");
    }

    setCurrentProductId(res.data.id);
    if (!isCustomMode && typeof window !== "undefined") {
      window.history.replaceState(null, "", `/admin/kukly/${res.data.id}`);
    }
    return res.data.id;
  };

  // Сохранение изменений в localStorage при наборе
  useEffect(() => {
    if (typeof window === "undefined" || isEditing) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({ title, story, price, heightCm, materials })
      );
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, story, price, heightCm, materials, isEditing, localStorageKey]);

  const handleSubmit = async (targetStatus?: "available" | "sold" | "made_to_order" | "draft") => {
    setErrorBanner(null);
    setSuccessBanner(null);

    const chosenStatus = targetStatus || status;
    const numericPrice = parseFloat(price.replace(",", "."));
    const numericHeight = parseInt(heightCm, 10);

    if (!title.trim()) {
      setErrorBanner("Пожалуйста, введите название куклы");
      return;
    }
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorBanner("Укажите корректную стоимость в рублях (BYN)");
      return;
    }
    if (isNaN(numericHeight) || numericHeight < 5) {
      setErrorBanner("Укажите примерный рост куклы (см)");
      return;
    }
    if (!story.trim()) {
      setErrorBanner("Напишите короткую историю или описание куклы для покупателей");
      return;
    }
    if (materials.length === 0) {
      setErrorBanner("Выберите хотя бы один материал куклы");
      return;
    }

    setIsSubmitting(true);

    const payload: ProductFormInput = {
      id: currentProductId || initialDoll?.id,
      title: title.trim(),
      story: story.trim(),
      price: numericPrice,
      heightCm: numericHeight,
      collection: collection.trim() || (isCustomMode ? "Индивидуальный заказ" : "Авторская серия"),
      materials,
      status: chosenStatus,
      isFeatured: isCustomMode ? false : isFeatured,
      isCustomOrder: isCustomMode || Boolean(initialDoll?.isCustomOrder),
      customRequestId: customRequestId || initialDoll?.customRequestId || null,
      details: {
        wingMaterial: materials.find((m) => m.toLowerCase().includes("дерев")) || "Резное дерево",
        hairMaterial: materials.find((m) => m.toLowerCase().includes("хлопок")) || "Хлопковая пряжа",
        dressMaterial: materials.find((m) => m.toLowerCase().includes("фатин")) || "Хлопок / Фатин",
        bouquetDetails: "Цветы ручной работы",
        hangingLoopIncluded: true,
        boxIncluded: true,
        certificateIncluded: true,
      },
    };

    try {
      const res = await saveProductAction(payload);
      if (!res.success) {
        setErrorBanner(res.error || "Не удалось сохранить куклу");
        setIsSubmitting(false);
        return;
      }

      // Очищаем черновик
      if (typeof window !== "undefined") {
        localStorage.removeItem(localStorageKey);
      }

      setSuccessBanner(
        isCustomMode
          ? "Кукла успешно прикреплена как ответ к заявке!"
          : chosenStatus === "draft"
          ? "Черновик куклы успешно сохранен!"
          : "Кукла успешно сохранена и опубликована на витрине!"
      );

      if (onSuccess) {
        setTimeout(() => {
          onSuccess({ id: res.data.id, slug: res.data.slug, title: title.trim() });
        }, 600);
        return;
      }

      setTimeout(() => {
        router.push("/admin/kukly");
        router.refresh();
      }, 1000);
    } catch {
      setErrorBanner("Произошла ошибка при обращении к серверу");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialDoll?.id) return;
    const confirmed = window.confirm(
      `Вы действительно хотите безвозвратно удалить куклу «${initialDoll.name}»?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(initialDoll.id);
      if (!res.success) {
        setErrorBanner(res.error);
        setIsDeleting(false);
        return;
      }
      router.push("/admin/kukly");
      router.refresh();
    } catch {
      setErrorBanner("Ошибка при удалении куклы");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Навигация назад */}
      <div className="flex items-center justify-between">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition py-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться к заявкам</span>
          </button>
        ) : (
          <Link
            href="/admin/kukly"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>К списку кукол</span>
          </Link>
        )}

        {isEditing && !isCustomMode && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить куклу</span>
          </button>
        )}
      </div>

      {/* Заголовок */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          {isCustomMode
            ? isEditing
              ? `Редактирование куклы: ${title}`
              : `Кукла в ответ на заявку${customerName ? ` (${customerName})` : ""}`
            : isEditing
            ? `Редактирование: ${initialDoll?.name}`
            : "Новая авторская кукла"}
        </h1>
        <p className="text-xs text-muted mt-0.5">
          {isCustomMode
            ? "Кукла будет персональным ответом на заявку и не появится в общем каталоге магазина"
            : "Заполните данные о кукле — технический адрес и сортировка настроятся автоматически"}
        </p>
      </div>

      {/* Уведомления об ошибке / успехе */}
      {errorBanner && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successBanner}</span>
        </div>
      )}

      {hasSavedDraft && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Найден несохранённый черновик куклы от прошлой сессии</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition cursor-pointer"
            >
              Восстановить
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="text-muted hover:text-amber-900 transition text-[11px] cursor-pointer px-1"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Карточка формы в один экран */}
      <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-7 space-y-5 shadow-xs">
        {/* 1. Название */}
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
          >
            Название куклы *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Селеста · Фея незабудок"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
          />
        </div>

        {/* Менеджер фотографий куклы («Без боли на телефоне») */}
        <div className="pt-1 border-t border-linen">
          <MediaManager
            productId={currentProductId}
            onEnsureProductId={ensureProductId}
            dollTitle={title}
            initialMedia={initialMediaItems}
          />
        </div>

        {/* 2. Стоимость и рост в 2 колонки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price"
              className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
            >
              Стоимость (BYN) *
            </label>
            <div className="relative">
              <input
                id="price"
                type="text"
                inputMode="decimal"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.00"
                className="w-full pl-3.5 pr-12 py-2.5 text-sm font-semibold text-terracotta rounded-xl border border-linen-dark bg-white placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                BYN
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="heightCm"
              className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
            >
              Рост куклы (см) *
            </label>
            <div className="relative">
              <input
                id="heightCm"
                type="text"
                inputMode="numeric"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="20"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted pointer-events-none">
                см
              </span>
            </div>
          </div>
        </div>

        {/* 3. Серия / Коллекция */}
        <div>
          <label
            htmlFor="collection"
            className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
          >
            Коллекция / Серия
          </label>
          <input
            id="collection"
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="Времена года, Лесные духи, Ангелы..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
          />
        </div>

        {/* 4. Материалы через быстрые чипы */}
        <MaterialChips selected={materials} onChange={setMaterials} />

        {/* 5. Литературная история / Описание */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="story"
              className="block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              История куклы *
            </label>
            <span className="text-[11px] text-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-terracotta" />
              Душевное описание для покупателя
            </span>
          </div>

          <AiStoryButton
            title={title}
            materials={materials}
            heightCm={parseInt(heightCm, 10) || 20}
            collection={collection}
            currentStory={story}
            onStoryGenerated={(newStory) => setStory(newStory)}
          />

          <textarea
            id="story"
            rows={5}
            required
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Опишите характер, детали и настроение куклы. Например: «Нежная лесная фея Селеста создана из натурального хлопка в прохладных мятных тонах. В ручках она бережно держит миниатюрный букетик незабудок...»"
            className="w-full px-3.5 py-2.5 text-xs leading-relaxed rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
          />
        </div>

        {/* 6. Человеческий статус куклы */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Статус на витрине *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus("available")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                status === "available"
                  ? "border-sage bg-sage/10 text-espresso"
                  : "border-linen-dark bg-white text-muted hover:border-linen-dark/80"
              }`}
            >
              <span className="font-semibold text-xs flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ищет дом
              </span>
              <span className="text-[11px] text-muted">В наличии для покупки</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("sold")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                status === "sold"
                  ? "border-muted bg-linen text-espresso"
                  : "border-linen-dark bg-white text-muted hover:border-linen-dark/80"
              }`}
            >
              <span className="font-semibold text-xs flex items-center gap-1.5 text-espresso">
                <span className="w-2 h-2 rounded-full bg-muted" />
                Нашла дом
              </span>
              <span className="text-[11px] text-muted">Переносится в архив</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("made_to_order")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                status === "made_to_order"
                  ? "border-purple-300 bg-purple-50 text-espresso"
                  : "border-linen-dark bg-white text-muted hover:border-linen-dark/80"
              }`}
            >
              <span className="font-semibold text-xs flex items-center gap-1.5 text-purple-700">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                На заказ
              </span>
              <span className="text-[11px] text-muted">Создание под заказ</span>
            </button>
          </div>
        </div>

        {/* 7. Флаг «Избранная работа» (только для обычного каталога) */}
        {!isCustomMode && (
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-linen-dark hover:bg-linen/30 transition cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-terracotta accent-terracotta"
            />
            <div className="text-xs">
              <span className="font-medium text-espresso block">
                Показывать на главной витрине
              </span>
              <span className="text-muted text-[11px]">
                Выводить в блоке «Избранные работы»
              </span>
            </div>
          </label>
        )}
      </div>

      {/* Кнопки сохранения */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-xl bg-terracotta text-white font-medium text-sm shadow-md hover:bg-terracotta-dark active:scale-[0.99] disabled:opacity-60 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Сохранение...</span>
            </>
          ) : (
            <span>
              {isCustomMode
                ? isEditing
                  ? "Сохранить изменения куклы"
                  : "Прикрепить куклу к заявке"
                : isEditing
                ? "Сохранить изменения"
                : "Опубликовать куклу"}
            </span>
          )}
        </button>

        {isCustomMode ? (
          onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="py-3 px-5 rounded-xl border border-linen-dark bg-white text-muted hover:text-espresso hover:bg-linen/50 active:scale-[0.99] transition text-xs font-medium cursor-pointer"
            >
              Отмена
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="py-3 px-5 rounded-xl border border-linen-dark bg-white text-muted hover:text-espresso hover:bg-linen/50 active:scale-[0.99] transition text-xs font-medium cursor-pointer"
          >
            Сохранить как черновик
          </button>
        )}
      </div>
    </div>
  );
}
