"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Clock,
  Database,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureAvailableTestDollAction } from "@/actions/demo";

interface DemoCenterClientProps {
  phoneQrDataUrl: string;
  lanUrl: string;
  initialDollSlug: string;
  initialDollTitle: string;
}

export function DemoCenterClient({
  phoneQrDataUrl,
  lanUrl,
  initialDollSlug,
  initialDollTitle,
}: DemoCenterClientProps) {
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedCreds, setCopiedCreds] = React.useState(false);
  const [testDollSlug, setTestDollSlug] = React.useState(initialDollSlug);
  const [testDollTitle, setTestDollTitle] = React.useState(initialDollTitle);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetMessage, setResetMessage] = React.useState<string | null>(null);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(lanUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyCreds = async () => {
    try {
      await navigator.clipboard.writeText("master@dollshop.by / DollMaster2026!");
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleResetDoll = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await ensureAvailableTestDollAction();
      if (res.success) {
        setTestDollSlug(res.slug);
        setTestDollTitle(res.title);
        setResetMessage(`Кукла «${res.title}» готова к покупке!`);
        setTimeout(() => setResetMessage(null), 4000);
      } else {
        setResetMessage(res.error || "Ошибка подготовки куклы");
      }
    } catch {
      setResetMessage("Сбой сервера");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Блок мобильного подключения (Hero) */}
      <div className="rounded-3xl border border-terracotta/20 bg-gradient-to-br from-terracotta/[0.05] via-amber-500/[0.03] to-linen/40 p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-3.5 py-1 text-xs font-medium text-terracotta border border-terracotta/20">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Тестирование с телефона и компьютера</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-light text-espresso leading-tight">
              Интерактивный центр тестирования <span className="italic text-terracotta">DollShop</span>
            </h1>

            <p className="text-sm text-muted leading-relaxed max-w-xl">
              Здесь вы можете проверить все реализованные функции бутика: от просмотра каталога и зума авторских деталей до 15-минутного таймера бронирования, чекаута с белорусскими адресами, эмулятора карт 3-D Secure, оплаты через ЕРИП и мобильной панели мастера.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-linen-dark text-xs font-mono text-espresso shadow-xs">
                <span>{lanUrl}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-6 w-6 p-0 text-muted hover:text-terracotta"
                  title="Скопировать ссылку"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <span className="text-xs text-muted">
                (Подключите смартфон к тому же Wi-Fi)
              </span>
            </div>
          </div>

          {/* QR-код для телефона */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-white border border-linen-dark shadow-xs space-y-3">
            <div className="relative h-44 w-44 rounded-xl overflow-hidden border border-linen-dark p-2 bg-white">
              <Image
                src={phoneQrDataUrl}
                alt="QR-код для открытия DollShop на телефоне"
                width={176}
                height={176}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-espresso flex items-center justify-center gap-1.5">
                <QrCode className="h-4 w-4 text-terracotta" />
                Наведите камеру смартфона
              </p>
              <p className="text-[11px] text-muted">
                Мгновенно откроет бутик в мобильном браузере
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Быстрый сброс / подготовка куклы для теста покупки */}
      <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-terracotta" />
            <h2 className="font-serif text-base font-medium text-espresso">
              Тестовая кукла для прогона чекаута
            </h2>
          </div>
          <p className="text-xs text-muted">
            Текущая кукла для проверки брони и покупки:{" "}
            <b className="text-espresso font-medium">{testDollTitle}</b> ({testDollSlug})
          </p>
          {resetMessage && (
            <p className="text-xs text-emerald-700 font-medium pt-1 animate-fade-in">
              {resetMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDoll}
            disabled={isResetting}
            className="rounded-xl text-xs h-9 gap-1.5 border-linen-dark hover:border-terracotta"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Подготовка...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-muted" />
                Сбросить / вернуть в «В наличии»
              </>
            )}
          </Button>

          <Button asChild size="sm" className="rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-xs h-9">
            <Link href={`/kukly/${testDollSlug}`}>
              <span>Открыть карточку куклы</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 3. Сетка интерактивных тестов по фазам */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Карточка 1: Витрина и Галерея */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-linen px-2 py-0.5 rounded-full">
                Фаза 2 & 4
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Витрина и карточка куклы
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Фильтрация «В наличии» / «Нашли дом», галерея фотографий ручной работы с зумом в Lightbox, свайпы на смартфоне, видео-обзор и характеристики.
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <Link
              href="/kukly"
              className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <span>Каталог кукол</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/kukly/${testDollSlug}`}
              className="text-xs text-muted hover:text-espresso underline"
            >
              Карточка
            </Link>
          </div>
        </div>

        {/* Карточка 2: 15-минутная бронь и защита от гонок */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Защита гонок
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Бронь на 15 минут
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Атомарная PostgreSQL-функция резервирования. Попробуйте нажать «Купить» с компьютера и телефона одновременно — ровно один покупатель получит таймер, а второй увидит статус «Забронировано».
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <Link
              href={`/kukly/${testDollSlug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <span>Проверить бронь</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[11px] text-muted">15 мин TTL</span>
          </div>
        </div>

        {/* Карточка 3: Чекаут и доставка */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-subtle text-sage-dark border border-sage/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-linen px-2 py-0.5 rounded-full">
                Закон № 99-З
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Оформление и доставка
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Выбор почты по Беларуси или самовывоза в Минске, маска телефона (+375), выбор канала связи (Telegram, Viber, звонок) и согласие на обработку персональных данных.
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <Link
              href={`/oformlenie/${testDollSlug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <span>Форма чекаута</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[11px] text-muted">Белпочта / Минск</span>
          </div>
        </div>

        {/* Карточка 4: Оплата картой онлайн & 3-D Secure */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Фаза 6 (Step 6.2)
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Оплата картой (3-D Secure)
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Интерактивный шлюз bePaid Sandbox. Тестовые карты (БЕЛКАРТ, МИР, Visa, MC), проверка успешной оплаты и сценария отказа банка. Кукла моментально переводится в «Нашла дом».
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <span className="text-xs text-muted">В чекауте: «Картой онлайн»</span>
            <Link
              href={`/oformlenie/${testDollSlug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
            >
              <span>Тестировать</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Карточка 5: Онлайн ЕРИП с QR-кодом */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                <QrCode className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Фаза 6 (Step 6.3)
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Онлайн ЕРИП с QR-кодом
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Отображение дерева каталога ЕРИП (Интернет-магазины → D → DollShop.by), копирование номера счёта, динамический QR-код для банковских приложений и кнопка тестовой симуляции.
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <span className="text-xs text-muted">В чекауте: «Онлайн ЕРИП»</span>
            <Link
              href={`/oformlenie/${testDollSlug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <span>Тестировать</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Карточка 6: Заявка «Хочу похожую» */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                <Camera className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-linen px-2 py-0.5 rounded-full">
                Step 4.9
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Заявка по фото «Хочу похожую»
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Индивидуальный заказ куклы: загрузка фото-референса прямо с камеры смартфона или компьютера, выбор палитры, пожелания и сохранение в базу с уведомлением мастера.
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <Link
              href="/na-zakaz"
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
            >
              <span>Форма заявки</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[11px] text-muted">Загрузка фото</span>
          </div>
        </div>

        {/* Карточка 7: Панель мастера (Mobile-first Admin) */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                <Lock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Админка мастера
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Панель управления мастера (Mobile-first)
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Управление витриной, добавление кукол с генерацией поэтичного описания через ИИ Gemini 2.5, загрузка фотографий, смена статусов заказов и ввод трек-номеров Белпочты с мгновенным обновлением у покупателя.
            </p>

            {/* Реквизиты для входа */}
            <div className="p-3 rounded-xl bg-alabaster border border-linen-dark text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-muted">
                  Логин: <code className="text-espresso font-mono font-semibold">master@dollshop.by</code>
                </p>
                <p className="text-muted">
                  Пароль: <code className="text-espresso font-mono font-semibold">DollMaster2026!</code>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCreds}
                className="h-7 text-[11px] rounded-lg gap-1 border-linen-dark"
              >
                {copiedCreds ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCreds ? "Скопировано" : "Копировать"}</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-linen-dark flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                <span>Вход в панель</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-muted">·</span>
              <Link
                href="/admin/orders"
                className="text-xs text-muted hover:text-espresso underline"
              >
                Заказы
              </Link>
              <span className="text-muted">·</span>
              <Link
                href="/admin/dolls/new"
                className="text-xs text-muted hover:text-espresso underline"
              >
                Создать куклу (ИИ)
              </Link>
            </div>
            <span className="text-[11px] text-muted">Адаптировано под телефон</span>
          </div>
        </div>

        {/* Карточка 8: Drizzle Studio (База данных) */}
        <div className="rounded-2xl border border-linen-dark bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-terracotta/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-300">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-linen px-2 py-0.5 rounded-full">
                PostgreSQL 18
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-espresso">
              Drizzle Studio (База данных)
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Графический интерфейс для инспекции таблиц PostgreSQL 18: товары, брони, заказы, медиа и токены.
            </p>
          </div>

          <div className="pt-2 border-t border-linen-dark flex items-center justify-between">
            <a
              href="http://localhost:4983"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:underline"
            >
              <span>Открыть Studio</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <span className="text-[11px] text-muted">порт 4983</span>
          </div>
        </div>
      </div>
    </div>
  );
}
