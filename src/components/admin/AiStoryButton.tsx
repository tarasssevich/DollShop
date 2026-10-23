"use client";

import { useState } from "react";
import { Sparkles, Loader2, Scissors, Heart } from "lucide-react";
import { generateDollStoryAction } from "@/actions/admin/ai";

export interface AiStoryButtonProps {
  title: string;
  materials?: string[];
  heightCm?: number;
  collection?: string;
  currentStory?: string;
  onStoryGenerated: (story: string) => void;
}

export function AiStoryButton({
  title,
  materials = [],
  heightCm,
  collection,
  currentStory = "",
  onStoryGenerated,
}: AiStoryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (
    mode: "default" | "shorter" | "warmer" | "alternative" = "default"
  ) => {
    if (!title.trim()) {
      setErrorMessage("Сначала введите название куклы выше");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setActiveMode(mode);

    try {
      const result = await generateDollStoryAction({
        title: title.trim(),
        materials,
        heightCm,
        collection,
        currentStory: currentStory.trim() || undefined,
        mode,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onStoryGenerated(result.story);
    } catch {
      setErrorMessage("Не удалось связаться с AI-ассистентом");
    } finally {
      setIsLoading(false);
      setActiveMode(null);
    }
  };

  const hasStory = Boolean(currentStory.trim());

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Главная кнопка генерации */}
        <button
          type="button"
          onClick={() => handleGenerate(hasStory ? "alternative" : "default")}
          disabled={isLoading}
          aria-label="Сгенерировать историю через AI"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#9A5B42] to-[#B36B4E] hover:from-[#884F39] hover:to-[#9A5B42] text-white shadow-xs active:scale-98 disabled:opacity-50 transition cursor-pointer min-h-[38px]"
        >
          {isLoading && activeMode !== "shorter" && activeMode !== "warmer" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Сочиняем историю...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {hasStory
                  ? "✨ Придумать другой вариант"
                  : "✨ Помочь придумать историю"}
              </span>
            </>
          )}
        </button>

        {/* Дополнительные быстрые кнопки стилей, если текст уже есть */}
        {hasStory && (
          <>
            <button
              type="button"
              onClick={() => handleGenerate("shorter")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-98 disabled:opacity-50 transition cursor-pointer min-h-[38px]"
            >
              {isLoading && activeMode === "shorter" ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#9A5B42]" />
              ) : (
                <Scissors className="w-3 h-3 text-stone-500" />
              )}
              <span>Короче</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate("warmer")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-98 disabled:opacity-50 transition cursor-pointer min-h-[38px]"
            >
              {isLoading && activeMode === "warmer" ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#9A5B42]" />
              ) : (
                <Heart className="w-3 h-3 text-[#9A5B42]" />
              )}
              <span>Теплее</span>
            </button>
          </>
        )}
      </div>

      {/* Ошибка при генерации */}
      {errorMessage && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
