"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

const SUGGESTED_MATERIALS = [
  "Эко-хлопок макраме",
  "Резное дерево",
  "Фатин с ромашками",
  "Крылышки бабочки",
  "Микробукет незабудок",
  "Лён",
  "Шёлк",
  "Винтажный шнур",
  "Ладолл",
  "Полимерная глина",
  "Мохер",
  "Стеклянные глаза",
];

interface MaterialChipsProps {
  selected: string[];
  onChange: (materials: string[]) => void;
  error?: string;
}

export function MaterialChips({ selected, onChange, error }: MaterialChipsProps) {
  const [customInput, setCustomInput] = useState("");
  const [savedCustomMaterials, setSavedCustomMaterials] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("dollshop_custom_materials");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedCustomMaterials(parsed);
        }
      }
    } catch {
      // Игнорируем ошибку чтения localStorage
    }
  }, []);

  const allSuggestions = Array.from(
    new Set([...SUGGESTED_MATERIALS, ...savedCustomMaterials])
  );

  const toggleMaterial = (mat: string) => {
    if (selected.includes(mat)) {
      onChange(selected.filter((m) => m !== mat));
    } else {
      onChange([...selected, mat]);
    }
  };

  const addCustomMaterial = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      if (!allSuggestions.includes(trimmed)) {
        const next = [...savedCustomMaterials, trimmed];
        setSavedCustomMaterials(next);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("dollshop_custom_materials", JSON.stringify(next));
          } catch {
            // Игнорируем
          }
        }
      }
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Материалы куклы
        </label>
        <span className="text-[11px] text-muted">
          Выбрано: {selected.length}
        </span>
      </div>

      {/* Быстрые чипы-подсказки */}
      <div className="flex flex-wrap gap-1.5">
        {allSuggestions.map((mat) => {
          const isSelected = selected.includes(mat);
          return (
            <button
              type="button"
              key={mat}
              onClick={() => toggleMaterial(mat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                isSelected
                  ? "bg-terracotta text-white shadow-xs"
                  : "bg-white text-espresso border border-linen-dark hover:border-terracotta/40"
              }`}
            >
              <span>{mat}</span>
              {isSelected ? (
                <X className="w-3 h-3 ml-0.5 opacity-80" />
              ) : (
                <Plus className="w-3 h-3 ml-0.5 opacity-40 text-muted" />
              )}
            </button>
          );
        })}
      </div>

      {/* Поле добавления своего материала */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomMaterial();
            }
          }}
          placeholder="Другой материал (нажмите Enter)..."
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-linen-dark bg-white text-espresso placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
        />
        <button
          type="button"
          onClick={addCustomMaterial}
          disabled={!customInput.trim()}
          className="px-3 py-2 rounded-xl text-xs font-medium bg-linen hover:bg-linen-dark text-espresso disabled:opacity-40 transition cursor-pointer shrink-0"
        >
          Добавить
        </button>
      </div>

      {/* Выбранные кастомные материалы (не из подсказок) */}
      {selected.filter((m) => !SUGGESTED_MATERIALS.includes(m)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected
            .filter((m) => !SUGGESTED_MATERIALS.includes(m))
            .map((mat) => (
              <span
                key={mat}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-terracotta/10 text-terracotta border border-terracotta/20 flex items-center gap-1"
              >
                <span>{mat}</span>
                <button
                  type="button"
                  onClick={() => toggleMaterial(mat)}
                  className="hover:text-red-700 cursor-pointer"
                  aria-label={`Удалить ${mat}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
