export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-xl space-y-6">
        <span className="inline-block rounded-full bg-[#9A5B42]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#9A5B42]">
          Фаза 1 · Шаг 1.1
        </span>
        <h1 className="text-4xl font-light tracking-tight text-[#1C1917] sm:text-5xl">
          DollShop
        </h1>
        <p className="text-lg font-light text-[#78716C] leading-relaxed">
          Цифровой арт-бутик и галерея авторских коллекционных кукол ручной работы (OOAK).
        </p>
        <div className="rounded-xl border border-[#9A5B42]/20 bg-[#F3EFE6] p-4 text-sm text-[#1C1917]/80 shadow-xs">
          ✅ Каркас Next.js успешно инициализирован (TypeScript strict, Tailwind CSS v4, ESLint).
        </div>
      </div>
    </main>
  );
}
