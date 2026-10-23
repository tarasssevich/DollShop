import * as React from "react";
import { Sparkles, Quote } from "lucide-react";

interface ProductStoryProps {
  name: string;
  story: string;
  description: string;
  collection?: string;
  className?: string;
}

export function ProductStory({
  name,
  story,
  description,
  collection,
  className = "",
}: ProductStoryProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Literary Story Quote */}
      <div className="relative rounded-2xl border border-linen-dark bg-alabaster/70 p-6 sm:p-7 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-terracotta font-semibold">
          <Quote className="h-3.5 w-3.5 fill-terracotta/20 text-terracotta" />
          <span>Слово мастера</span>
        </div>

        <blockquote className="font-serif italic text-lg sm:text-xl text-espresso leading-relaxed">
          «{story}»
        </blockquote>

        {collection && (
          <p className="text-xs text-muted flex items-center gap-1.5 pt-1">
            <Sparkles className="h-3 w-3 text-sage" />
            <span>Коллекция: «{collection}»</span>
          </p>
        )}
      </div>

      {/* Narrative Description */}
      <div className="space-y-3 text-sm text-espresso-soft leading-relaxed">
        <h3 className="font-serif text-xl font-medium text-espresso">
          Характер и образ «{name}»
        </h3>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    </div>
  );
}
