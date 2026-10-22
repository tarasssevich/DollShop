import Link from "next/link";

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-alabaster py-12 px-4 sm:px-6 lg:px-8 font-sans text-espresso">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Navigation & Header */}
        <header className="border-b border-linen-dark pb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-full bg-terracotta/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta">
              Дизайн-система v1.0
            </span>
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-muted hover:text-terracotta transition-colors"
            >
              ← На главную
            </Link>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-espresso">
            DollShop Styleguide
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted leading-relaxed">
            Эстетика «Теплый цифровой арт-бутик»: естественные природные оттенки (алебастр, лен,
            терракота, шалфей), благородная антиква Cormorant Garamond и чистый функциональный гротеск Manrope.
          </p>
        </header>

        {/* 1. Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-normal text-espresso">1. Цветовая палитра</h2>
            <p className="text-sm text-muted">
              Базовые тона фона, акценты терракоты и шалфея для взаимодействия и статусов.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {/* Alabaster */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-alabaster border border-linen-dark" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Alabaster</p>
                <p className="font-mono text-[11px] text-muted">#FAF8F5</p>
                <p className="text-[10px] text-muted-light mt-0.5">Основной фон</p>
              </div>
            </div>

            {/* Linen */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-linen" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Linen</p>
                <p className="font-mono text-[11px] text-muted">#F3EFE6</p>
                <p className="text-[10px] text-muted-light mt-0.5">Вторичный / карточки</p>
              </div>
            </div>

            {/* Espresso */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-espresso" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Espresso</p>
                <p className="font-mono text-[11px] text-muted">#1C1917</p>
                <p className="text-[10px] text-muted-light mt-0.5">Основной текст</p>
              </div>
            </div>

            {/* Muted */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-muted" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Muted</p>
                <p className="font-mono text-[11px] text-muted">#78716C</p>
                <p className="text-[10px] text-muted-light mt-0.5">Вторичный текст</p>
              </div>
            </div>

            {/* Terracotta Main */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-terracotta" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Terracotta</p>
                <p className="font-mono text-[11px] text-muted">#9A5B42</p>
                <p className="text-[10px] text-muted-light mt-0.5">Главный акцент</p>
              </div>
            </div>

            {/* Sage Main */}
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-sage" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Sage</p>
                <p className="font-mono text-[11px] text-muted">#4A5D4E</p>
                <p className="text-[10px] text-muted-light mt-0.5">Вторичный акцент</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Typography Scale */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">2. Иерархия заголовков (Cormorant Garamond)</h2>
            <p className="text-sm text-muted">Благородная антиква с выраженным характером для крупных акцентов и арт-подачи.</p>
          </div>

          <div className="space-y-6 rounded-2xl border border-linen-dark bg-white p-6 sm:p-8">
            <div className="border-b border-linen pb-4">
              <span className="text-[11px] font-mono uppercase text-muted tracking-widest">H1 · font-serif text-5xl font-light</span>
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-espresso mt-1">
                Фарфоровая мечта в лунном свете
              </h1>
            </div>

            <div className="border-b border-linen pb-4">
              <span className="text-[11px] font-mono uppercase text-muted tracking-widest">H2 · font-serif text-3xl font-normal</span>
              <h2 className="font-serif text-3xl font-normal text-espresso mt-1">
                Авторские шарнирные куклы ручной работы
              </h2>
            </div>

            <div className="border-b border-linen pb-4">
              <span className="text-[11px] font-mono uppercase text-muted tracking-widest">H3 · font-serif text-2xl font-normal</span>
              <h3 className="font-serif text-2xl font-normal text-espresso mt-1">
                Коллекция «Шепот осеннего леса»
              </h3>
            </div>

            <div className="border-b border-linen pb-4">
              <span className="text-[11px] font-mono uppercase text-muted tracking-widest">H4 · font-serif text-xl font-medium</span>
              <h4 className="font-serif text-xl font-medium text-espresso mt-1">
                Особенности росписи и материалы креплений
              </h4>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-muted tracking-widest">Цитата / Story Quote · font-serif italic text-2xl</span>
              <blockquote className="font-serif italic text-xl sm:text-2xl text-terracotta mt-2 leading-relaxed pl-4 border-l-2 border-terracotta">
                «Каждая кукла рождается с собственным именем и настроением. В ней нет фабричной симметрии — лишь живое дыхание ручного искусства.»
              </blockquote>
            </div>
          </div>
        </section>

        {/* 3. Cyrillic Text & Font Comparison */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">3. Кириллический текст и шрифтовая пара</h2>
            <p className="text-sm text-muted">
              Сравнение основного гротеска Manrope с Inter. Обратите внимание на чистоту и мягкость округлостей Manrope при наборе цен и характеристик.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manrope Card (Primary) */}
            <div className="rounded-2xl border-2 border-terracotta/40 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-semibold text-terracotta uppercase tracking-wider">
                  Manrope (Основной выбор)
                </span>
                <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[11px] font-medium text-terracotta">
                  Рекомендуемый
                </span>
              </div>
              <p className="font-sans text-base text-espresso leading-relaxed">
                Съешь же ещё этих мягких французских булок, да выпей чаю. Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства.
              </p>
              <div className="mt-4 pt-4 border-t border-linen space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Высота:</span>
                  <span className="font-medium text-espresso">36 см</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Материалы:</span>
                  <span className="font-medium text-espresso">Фарфор, шёлк, мохер</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Цена:</span>
                  <span className="font-semibold text-lg text-terracotta">420 BYN</span>
                </div>
              </div>
            </div>

            {/* Inter Card (Comparison) */}
            <div className="rounded-2xl border border-linen-dark bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-semibold text-muted uppercase tracking-wider">
                  Inter (Альтернатива)
                </span>
                <span className="rounded-full bg-linen px-2 py-0.5 text-[11px] font-medium text-muted">
                  Технический
                </span>
              </div>
              <p className="font-inter text-base text-espresso leading-relaxed">
                Съешь же ещё этих мягких французских булок, да выпей чаю. Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства.
              </p>
              <div className="mt-4 pt-4 border-t border-linen space-y-2 font-inter">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Высота:</span>
                  <span className="font-medium text-espresso">36 см</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Материалы:</span>
                  <span className="font-medium text-espresso">Фарфор, шёлк, мохер</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Цена:</span>
                  <span className="font-semibold text-lg text-terracotta">420 BYN</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Status Badges & Price formatting */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">4. Статусы кукол и цены (BYN)</h2>
            <p className="text-sm text-muted">Каждая кукла существует в единственном экземпляре и имеет уникальный статус жизненного цикла.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Available */}
            <div className="rounded-xl border border-linen-dark bg-white p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-subtle px-2.5 py-1 text-xs font-medium text-terracotta">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta animate-pulse" />
                Ищет дом
              </span>
              <p className="mt-3 text-xs text-muted">Доступна для моментальной покупки</p>
              <p className="mt-2 text-2xl font-light text-espresso">380 BYN</p>
            </div>

            {/* Reserved */}
            <div className="rounded-xl border border-linen-dark bg-white p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                Забронирована (14:28)
              </span>
              <p className="mt-3 text-xs text-muted">Покупатель в процессе чекаута</p>
              <p className="mt-2 text-2xl font-light text-muted">450 BYN</p>
            </div>

            {/* Made to order */}
            <div className="rounded-xl border border-linen-dark bg-white p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-subtle px-2.5 py-1 text-xs font-medium text-sage">
                <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                На заказ
              </span>
              <p className="mt-3 text-xs text-muted">Срок создания: 3–4 недели</p>
              <p className="mt-2 text-2xl font-light text-espresso">от 500 BYN</p>
            </div>

            {/* Sold / In collection */}
            <div className="rounded-xl border border-linen-dark bg-white p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linen px-2.5 py-1 text-xs font-medium text-muted">
                В частной коллекции
              </span>
              <p className="mt-3 text-xs text-muted">Кукла продана, доступен повтор</p>
              <p className="mt-2 text-2xl font-light text-muted-light line-through">620 BYN</p>
            </div>
          </div>
        </section>

        {/* 5. Buttons preview */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">5. Интерактивные элементы (Кнопки действий)</h2>
            <p className="text-sm text-muted">Базовые варианты кнопок в фирменной терракотовой и шалфейной гамме.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              type="button"
              className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-terracotta-hover active:scale-[0.98]"
            >
              Купить сейчас · 380 BYN
            </button>

            <button
              type="button"
              className="rounded-full bg-sage px-6 py-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-sage-hover active:scale-[0.98]"
            >
              Хочу похожую на заказ
            </button>

            <button
              type="button"
              className="rounded-full border border-linen-dark bg-white px-6 py-3 text-sm font-medium text-espresso transition-all hover:bg-linen active:scale-[0.98]"
            >
              История куклы
            </button>

            <button
              type="button"
              disabled
              className="rounded-full bg-linen px-6 py-3 text-sm font-medium text-muted cursor-not-allowed opacity-60"
            >
              В частной коллекции
            </button>
          </div>
        </section>

        {/* Footer info */}
        <footer className="border-t border-linen-dark pt-8 pb-16 text-center text-xs text-muted">
          DollShop · OOAK Art Boutique & Gallery · Минск, Беларусь
        </footer>
      </div>
    </div>
  );
}
