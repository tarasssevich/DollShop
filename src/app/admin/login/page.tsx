"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { signIn } from "@/lib/auth/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl") || "/admin/kukly";
  // Защита от Open Redirect (CWE-601): разрешаем только безопасные внутренние маршруты админки
  const isValidReturnUrl =
    rawReturnUrl.startsWith("/admin") &&
    !rawReturnUrl.startsWith("//") &&
    !rawReturnUrl.includes("\\");
  const returnUrl = isValidReturnUrl ? rawReturnUrl : "/admin/kukly";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Пожалуйста, заполните email и пароль");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        if (res.error.status === 429) {
          setErrorMessage("Слишком много попыток входа. Пожалуйста, подождите минуту.");
        } else {
          setErrorMessage("Неверный email или пароль мастера. Проверьте введённые данные.");
        }
        setIsLoading(false);
        return;
      }

      window.location.href = returnUrl;
    } catch {
      setErrorMessage("Ошибка подключения к серверу. Попробуйте еще раз.");
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("master@dollshop.by");
    setPassword("DollMaster2026!");
    setErrorMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
        >
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
        >
          Email мастера
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="master@dollshop.by"
          disabled={isLoading}
          className="w-full px-3.5 py-2.5 rounded-xl border border-linen-dark bg-white text-espresso text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
        >
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={isLoading}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-linen-dark bg-white text-espresso text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-espresso transition p-1"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-3 px-4 rounded-xl bg-terracotta text-white font-medium text-sm shadow-sm hover:bg-terracotta-dark active:scale-[0.99] disabled:opacity-60 transition flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Вход в систему...</span>
          </>
        ) : (
          <span>Войти в кабинет</span>
        )}
      </button>

      {/* Подсказка и быстрое заполнение для тестирования */}
      <div className="pt-3 border-t border-linen-dark/60 text-center">
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-xs text-terracotta hover:underline font-medium cursor-pointer"
        >
          Заполнить данные мастера (1 клик)
        </button>
        <p className="text-[11px] text-muted mt-1 font-mono">
          master@dollshop.by / DollMaster2026!
        </p>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-alabaster flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Бренд и заголовок */}
        <div className="text-center space-y-3">
          <div className="relative inline-block w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-linen-dark bg-white shadow-sm p-1">
            <Image
              src="/images/logo-128.webp"
              alt="Логотип DollShop — Ателье авторских кукол"
              fill
              sizes="96px"
              className="object-cover rounded-full"
              priority
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-espresso font-light">
              Кабинет мастера
            </h1>
            <p className="text-xs text-muted mt-1">
              DollShop · Управление коллекциями, заказами и витриной
            </p>
          </div>
        </div>

        {/* Карточка формы */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-linen-dark shadow-sm">
          <Suspense
            fallback={
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Ссылка назад на витрину */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться на витрину магазина
          </Link>
        </div>
      </div>
    </div>
  );
}
