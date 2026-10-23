import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, Phone, Mail, ShieldCheck, Heart } from "lucide-react";
import { Container } from "./Container";
import { Separator } from "@/components/ui/separator";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-linen-dark bg-linen/50 text-espresso text-sm">
      {/* Upper footer grid */}
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Brand manifesto */}
          <div className="space-y-4">
            <Link href="/" className="group flex items-center gap-3 leading-none">
              <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border border-linen-dark/80 bg-white shadow-2xs transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo-128.webp"
                  alt="Логотип DollShop — Ателье авторских кукол"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-serif text-3xl font-light tracking-tight text-espresso transition-colors group-hover:text-terracotta block">
                  DollShop
                </span>
                <p className="font-serif italic text-xs text-muted mt-0.5">
                  ателье авторских кукол ручной работы
                </p>
              </div>
            </Link>

            <p className="text-xs text-muted leading-relaxed">
              Каждая фея создается вручную с душой и заботой.
              Натуральный эко-хлопок макраме, светлое дерево, невесомый фатин и живое тепло рук мастера.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://t.me/dollshop_by"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-linen-dark bg-white text-espresso transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white"
                aria-label="Telegram канал и чат мастера"
              >
                <Send className="h-4 w-4" />
              </a>

              <a
                href="https://instagram.com/dollshop_by"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-linen-dark bg-white text-espresso transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white"
                aria-label="Instagram галерея"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>

              <a
                href="tel:+375291234567"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-linen-dark bg-white text-espresso transition-colors hover:border-sage hover:bg-sage hover:text-white"
                aria-label="Позвонить мастеру"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* 2. Navigation */}
          <div className="space-y-3">
            <p className="font-serif text-lg font-medium text-espresso">
              Коллекции
            </p>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link
                  href="/kukly"
                  className="hover:text-terracotta transition-colors"
                >
                  Куклы в наличии (Ищут дом)
                </Link>
              </li>
              <li>
                <Link
                  href="/na-zakaz"
                  className="hover:text-terracotta transition-colors"
                >
                  Куклы на заказ
                </Link>
              </li>
              <li>
                <Link
                  href="/galereya"
                  className="hover:text-terracotta transition-colors"
                >
                  Галерея проданных работ
                </Link>
              </li>
              <li>
                <Link
                  href="/o-mastere"
                  className="hover:text-terracotta transition-colors"
                >
                  О мастере и технике
                </Link>
              </li>
              <li>
                <Link
                  href="/styleguide"
                  className="hover:text-terracotta transition-colors text-terracotta font-medium"
                >
                  Дизайн-система (Styleguide)
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="hover:text-terracotta transition-colors font-medium text-espresso flex items-center gap-1"
                >
                  <span>Тест-центр всех фичей ⚡</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Customer Care & Fulfillment */}
          <div className="space-y-3">
            <p className="font-serif text-lg font-medium text-espresso">
              Покупателям
            </p>
            <ul className="space-y-2.5 text-xs text-muted leading-relaxed">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                <span>Отправка почтой по Беларуси или самовывоз в Минске</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-sage mt-0.5" />
                <span>Фирменная подарочная коробка и паспорт</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                <span>Бронь куклы на 15 минут в корзине</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/dostavka-i-oplata"
                  className="inline-flex items-center text-terracotta hover:underline font-medium"
                >
                  Все условия получения и оплаты →
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Legal requirements (Belarus Edict No. 60 & Trade Register) */}
          <div className="space-y-3">
            <p className="font-serif text-lg font-medium text-espresso">
              Информация о продавце
            </p>
            <div className="space-y-1.5 text-xs text-muted leading-relaxed">
              <p className="font-medium text-espresso">
                ИП Прокопенко Алёна Васильевна
              </p>
              <p>УНП: 193758204</p>
              <p>Зарегистрирован Минским горисполкомом</p>
              <p>
                Внесен в Торговый реестр Республики Беларусь: № 584920 от 12.03.2024
              </p>
              <p>Адрес: 220030, г. Минск, ул. Ленина, д. 14</p>
              <p>Время работы магазина: круглосуточно</p>
              <p>Обработка заказов: Пн–Сб 10:00–20:00</p>
            </div>
          </div>
        </div>
      </Container>

      <Separator className="bg-linen-dark/60" />

      {/* Bottom strip with copyright and legal links */}
      <Container className="py-6">
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted sm:flex-row">
          <p>© 2026 DollShop. Все права защищены.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <Link
              href="/oferta"
              className="hover:text-terracotta transition-colors"
            >
              Публичная оферта
            </Link>
            <Link
              href="/politika-konfidencialnosti"
              className="hover:text-terracotta transition-colors"
            >
              Политика персональных данных (Закон № 99-З)
            </Link>
            <Link
              href="/dostavka-i-oplata"
              className="hover:text-terracotta transition-colors"
            >
              Почта, самовывоз и оплата
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
