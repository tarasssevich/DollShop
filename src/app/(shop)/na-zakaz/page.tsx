"use client";

import * as React from "react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Send,
  Truck,
  Heart,
  Palette,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isValidBelarusPhone, normalizeBelarusPhone } from "@/lib/utils/phone";

export default function CustomOrderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted">
          Загрузка формы индивидуального заказа...
        </div>
      }
    >
      <CustomOrderContent />
    </React.Suspense>
  );
}

function CustomOrderContent() {
  const searchParams = useSearchParams();
  const fromDoll = searchParams.get("from");

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [wishes, setWishes] = React.useState(() => {
    if (fromDoll) {
      return `Здравствуйте! Очень понравилась работа «${fromDoll}» из архива галереи. Хотелось бы обсудить создание похожей куколки-феи по мотивам.`;
    }
    return "";
  });
  const [agreed, setAgreed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error("Пожалуйста, укажите ваше имя");
      return;
    }

    if (!isValidBelarusPhone(phone)) {
      toast.error("Укажите корректный номер телефона Беларуси (+375...)");
      return;
    }

    if (!agreed) {
      toast.error("Необходимо подтвердить согласие с условиями оферты");
      return;
    }

    setIsSubmitting(true);

    // Simulate instant safe request handling
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Ваша заявка успешно отправлена мастеру!", {
        description: `Мастер свяжется с вами по номеру ${normalizeBelarusPhone(phone)} в ближайшее время.`,
      });
    }, 600);
  };

  return (
    <div className="py-10 sm:py-16">
      <Container className="space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sage/20 bg-sage-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sage">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Индивидуальный заказ (OOAK)</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-espresso">
            Создание авторской куклы вашей мечты
          </h1>

          <p className="text-base text-muted leading-relaxed">
            Если среди готовых работ нет той, которая откликнулась в самом сердце,
            вы можете заказать создание уникального образа. Мы согласуем каждую
            деталь: от выражения взгляда до винтажного кружева на манжетах.
          </p>
        </div>

        {/* 4 Steps of Creation Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-subtle text-terracotta">
              <Palette className="h-5 w-5" />
            </div>
            <p className="font-mono text-xs font-semibold text-muted">ШАГ 01</p>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Цвета и образ
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Выбираем оттенок платья (мятный, лавандовый, пудровый), цвет волос
              и повод (подарок, оберег, детская комната).
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-subtle text-sage">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="font-mono text-xs font-semibold text-muted">ШАГ 02</p>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Дерево и роспись
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Подбор точеной деревянной бусины с милой росписью личика и резных
              ажурных крылышек бабочки.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linen text-espresso">
              <Heart className="h-5 w-5" />
            </div>
            <p className="font-mono text-xs font-semibold text-muted">ШАГ 03</p>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Хлопок и фатин
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Плетение локонов из мягкой хлопковой пряжи, сборка корсажа и
              воздушной юбочки с ромашками.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-subtle text-terracotta">
              <Truck className="h-5 w-5" />
            </div>
            <p className="font-mono text-xs font-semibold text-muted">ШАГ 04</p>
            <h3 className="font-serif text-xl font-medium text-espresso">
              Букетик и упаковка
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Мини-букетик цветов в ручки, подарочная крафтовая коробочка с лентой
              и отправка Европочтой за 2–3 дня.
            </p>
          </div>
        </div>

        {/* Details & Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-linen-dark pt-8">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-linen-dark bg-linen/50 p-6 space-y-4">
              <h3 className="font-serif text-2xl font-normal text-espresso">
                Условия и сроки
              </h3>

              <div className="space-y-3 text-xs text-muted leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-espresso block">
                      Срок изготовления:
                    </span>
                    <span>3–5 дней от выбора образа до отправки.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Heart className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-espresso block">
                      Стоимость куколки:
                    </span>
                    <span>от 45 до 65 BYN (включая подарочную упаковку).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-espresso block">
                      Поэтапный фотоотчет:
                    </span>
                    <span>
                      Мастер присылает фото процесса лепки, росписи и примерки в
                      Telegram или Viber.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 shadow-xs">
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-3xl font-light text-espresso">
                    Заявка принята!
                  </h3>
                  <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                    Спасибо за доверие к мастерской. Мы свяжемся с вами в Telegram
                    или по телефону для обсуждения деталей вашего заказа.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full mt-4"
                    onClick={() => setSubmitted(false)}
                  >
                    Отправить еще одну заявку
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl font-normal text-espresso">
                      Оставить заявку на куклу
                    </h3>
                    <p className="text-xs text-muted">
                      Заполните форму, и мастер ответит на все вопросы без каких-либо
                      обязательств.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-name">Ваше имя</Label>
                      <Input
                        id="order-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например, Екатерина"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order-phone">
                        Телефон Беларуси (для звонка или Telegram)
                      </Label>
                      <Input
                        id="order-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+375 (29) 123-45-67"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order-wishes">
                      Ваши пожелания к образу (рост, цветовая гамма, характер)
                    </Label>
                    <Textarea
                      id="order-wishes"
                      value={wishes}
                      onChange={(e) => setWishes(e.target.value)}
                      rows={4}
                      placeholder="Расскажите о фее: для кого она создается, повод (подарок, оберег, день рождения), желаемые оттенки наряда и цветочки в ручках..."
                    />
                  </div>

                  <label
                    htmlFor="order-terms"
                    className="flex items-start gap-2.5 cursor-pointer select-none pt-1"
                  >
                    <Checkbox
                      id="order-terms"
                      checked={agreed}
                      onCheckedChange={(c) => setAgreed(c === true)}
                    />
                    <span className="text-xs text-muted leading-relaxed">
                      Я подтверждаю согласие с условиями{" "}
                      <Link
                        href="/oferta"
                        target="_blank"
                        className="text-terracotta underline hover:text-terracotta-hover"
                      >
                        публичной оферты
                      </Link>{" "}
                      и{" "}
                      <Link
                        href="/politika-konfidencialnosti"
                        target="_blank"
                        className="text-terracotta underline hover:text-terracotta-hover"
                      >
                        политики конфиденциальности
                      </Link>{" "}
                      (Закон РБ № 99-З).
                    </span>
                  </label>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full rounded-full shadow-xs"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    <span>
                      {isSubmitting ? "Отправка..." : "Отправить заявку мастеру"}
                    </span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
