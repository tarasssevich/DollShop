import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-alabaster px-4 py-16 text-center font-sans text-espresso">
      <div className="max-w-xl space-y-6">
        <span className="inline-block rounded-full bg-terracotta/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-terracotta">
          Фаза 1 · Шаг 1.2 готов
        </span>

        <h1 className="font-serif text-5xl sm:text-6xl font-light tracking-tight text-espresso">
          DollShop
        </h1>

        <p className="text-lg font-light text-muted leading-relaxed">
          Цифровой арт-бутик и галерея авторских коллекционных кукол ручной работы (OOAK).
        </p>

        <div className="rounded-2xl border border-linen-dark bg-linen p-5 text-sm text-espresso/90 shadow-xs space-y-2">
          <p className="font-medium">✅ Каркас и дизайн-система развернуты</p>
          <p className="text-xs text-muted">
            Палитра: алебастр, лен, терракота, шалфей. Шрифты: Cormorant Garamond + Manrope.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/styleguide"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-sm font-medium text-white shadow-xs transition-all hover:bg-terracotta-hover active:scale-[0.98]"
          >
            Посмотреть витрину Styleguide →
          </Link>
        </div>
      </div>
    </main>
  );
}
