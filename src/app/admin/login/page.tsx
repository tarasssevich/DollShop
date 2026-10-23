"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { signIn } from "@/lib/auth/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin/kukly";

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

      router.push(returnUrl);
      router.refresh();
    } catch {
      setErrorMessage("Ошибка подключения к серверу. Попробуйте еще раз.");
      setIsLoading(false);
    }
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
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-alabaster flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Бренд и заголовок */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-espresso font-light">
            Кабинет мастера
          </h1>
          <p className="text-xs text-muted">
            Управление куклами, заказами и настройками магазина
          </p>
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
