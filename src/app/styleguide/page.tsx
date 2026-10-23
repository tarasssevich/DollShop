"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Heart,
  ShoppingBag,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

export default function StyleguidePage() {
  const [agreementChecked, setAgreementChecked] = React.useState(false);
  const [deliveryMethod, setDeliveryMethod] = React.useState("europost");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <div className="min-h-screen bg-alabaster py-12 px-4 sm:px-6 lg:px-8 font-sans text-espresso selection:bg-terracotta/15 selection:text-terracotta">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Navigation & Header */}
        <header className="border-b border-linen-dark pb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-full bg-terracotta-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta border border-terracotta/20">
              Дизайн-система v1.0 · shadcn/ui
            </span>
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-muted hover:text-terracotta transition-colors"
            >
              ← На главную
            </Link>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-espresso">
            Витрина компонентов DollShop
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted leading-relaxed">
            Коллекция базовых UI-компонентов на базе shadcn/ui и Radix UI,
            стилизованная под теплую эстетику арт-бутика авторских кукол.
          </p>
        </header>

        {/* 1. Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-normal text-espresso">
              1. Фирменная палитра
            </h2>
            <p className="text-sm text-muted">
              Натуральные природные оттенки для фона, карточек и акцентов.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-alabaster border border-linen-dark" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Alabaster</p>
                <p className="font-mono text-[11px] text-muted">#FAF8F5</p>
                <p className="text-[10px] text-muted-light mt-0.5">Основной холст</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-linen" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Linen</p>
                <p className="font-mono text-[11px] text-muted">#F3EFE6</p>
                <p className="text-[10px] text-muted-light mt-0.5">Карточки, вкладки</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-linen-dark" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Linen Dark</p>
                <p className="font-mono text-[11px] text-muted">#EAE4D8</p>
                <p className="text-[10px] text-muted-light mt-0.5">Бордюры и линии</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-espresso" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Espresso</p>
                <p className="font-mono text-[11px] text-muted">#1C1917</p>
                <p className="text-[10px] text-muted-light mt-0.5">Основной текст</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-linen-dark bg-white p-3 shadow-xs">
              <div className="h-16 w-full rounded-lg bg-terracotta" />
              <div className="mt-3">
                <p className="font-medium text-xs text-espresso">Terracotta</p>
                <p className="font-mono text-[11px] text-muted">#9A5B42</p>
                <p className="text-[10px] text-muted-light mt-0.5">Главный акцент</p>
              </div>
            </div>

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

        {/* 2. Buttons */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              2. Кнопки (Button)
            </h2>
            <p className="text-sm text-muted">
              Варианты состояний, размеров и интеграция с иконками Lucide.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-3">
                Варианты стилей
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="default">
                  <ShoppingBag className="h-4 w-4" />
                  Терракотовая (Primary)
                </Button>
                <Button variant="secondary">
                  <Sparkles className="h-4 w-4" />
                  Шалфей (Secondary)
                </Button>
                <Button variant="outline">Контурная (Outline)</Button>
                <Button variant="subtle">Мягкая терракота</Button>
                <Button variant="sage-subtle">Мягкий шалфей</Button>
                <Button variant="ghost">Прозрачная (Ghost)</Button>
                <Button variant="destructive">Удалить</Button>
                <Button variant="link">Ссылка в тексте</Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-3">
                Размеры и иконки
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Размер SM</Button>
                <Button size="default">Размер Default (MD)</Button>
                <Button size="lg">Размер LG · В корзину</Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsLiked(!isLiked)}
                  title="Добавить в избранное"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isLiked ? "fill-terracotta text-terracotta" : "text-muted"
                    }`}
                  />
                </Button>
                <Button variant="ghost" size="icon-sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button disabled>
                  <Clock className="h-4 w-4" />
                  Заблокирована
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Badges */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              3. Бейджи статусов (Badge)
            </h2>
            <p className="text-sm text-muted">
              Отображают жизненный цикл единственного экземпляра куклы (OOAK).
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="available">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                В наличии · Доступна к покупке
              </Badge>

              <Badge variant="reserved">
                <Clock className="h-3 w-3" />
                Забронирована (14:32)
              </Badge>

              <Badge variant="sold">В частной коллекции</Badge>

              <Badge variant="in_progress">
                <Sparkles className="h-3 w-3" />В процессе создания
              </Badge>

              <Badge variant="ooak">Единственный экземпляр (OOAK)</Badge>

              <Badge variant="default">Бестселлер</Badge>
              <Badge variant="secondary">Ручной шов</Badge>
              <Badge variant="outline">Высота 36 см</Badge>
            </div>
          </div>
        </section>

        {/* 4. Interactive Dialog & Sheet */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              4. Модальные окна и шторки (Dialog & Sheet)
            </h2>
            <p className="text-sm text-muted">
              Доступные всплывающие окна бронирования и выдвижная панель корзины.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 flex flex-wrap gap-4 items-center">
            {/* Dialog Demo */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Clock className="h-4 w-4" />
                  Открыть окно бронирования (Dialog)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 rounded-full px-2.5 py-0.5 border border-amber-200/80 w-fit mb-1">
                    <Clock className="h-3 w-3" /> 15 минут на оформление
                  </div>
                  <DialogTitle>Забронировать фею «Селеста»</DialogTitle>
                  <DialogDescription>
                    Фея будет временно закреплена за вами. Если оформление заказа
                    не завершится в течение 15 минут, бронь автоматически снимется
                    в пользу следующего ценителя.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 border-y border-linen-dark/60 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Фея:</span>
                    <span className="font-medium text-espresso">«Селеста · Фея незабудок»</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Материалы:</span>
                    <span className="text-espresso">Хлопок макраме, фатин, дерево</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Стоимость:</span>
                    <span className="font-semibold text-lg text-terracotta">
                      55 BYN
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button
                    variant="default"
                    onClick={() => {
                      setDialogOpen(false);
                      toast.success("Бронь успешно оформлена на 15 минут!", {
                        description: "Перейдите к оформлению заказа для завершения покупки.",
                      });
                    }}
                  >
                    Подтвердить бронь
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Sheet Demo */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <ShoppingBag className="h-4 w-4" />
                  Открыть корзину (Sheet справа)
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Ваша корзина</SheetTitle>
                  <SheetDescription>
                    Выбранные авторские произведения ручной работы.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-4">
                  <div className="flex gap-4 items-center p-3 rounded-xl border border-linen-dark bg-white">
                    <div className="h-16 w-16 rounded-lg bg-linen flex items-center justify-center text-xs text-muted font-serif">
                      Фото
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-medium text-espresso truncate">
                        Фея «Селеста»
                      </p>
                      <p className="text-xs text-muted">Хлопок, фатин с ромашками, 22 см</p>
                      <p className="text-sm font-semibold text-terracotta mt-1">
                        55 BYN
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-linen p-3.5 space-y-1.5 text-xs text-muted leading-relaxed">
                    <p className="flex items-center gap-1.5 font-medium text-espresso">
                      <ShieldCheck className="h-3.5 w-3.5 text-sage" />
                      Гарантия подлинности и безопасности
                    </p>
                    <p>
                      Доставка по всей Беларуси через Европочту с трек-номером и
                      проверкой комплектности при получении.
                    </p>
                  </div>
                </div>

                <SheetFooter className="mt-auto">
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center text-base font-medium">
                      <span>Итого:</span>
                      <span className="font-semibold text-xl text-terracotta">
                        420 BYN
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        setSheetOpen(false);
                        toast.info("Переход к чекауту...", {
                          description: "Заполнение адреса Европочты и данных получателя.",
                        });
                      }}
                    >
                      Перейти к оформлению
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        {/* 5. Toasts (Sonner) */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              5. Всплывающие уведомления (Sonner Toast)
            </h2>
            <p className="text-sm text-muted">
              Информативные и контекстные уведомления для пользователя.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Кукла добавлена в список желаний!", {
                  description: "Мы пришлем вам уведомление при изменениях статуса.",
                })
              }
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Уведомление об успехе
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.warning("Время резерва подходит к концу", {
                  description: "Осталось менее 3 минут для подтверждения покупки.",
                })
              }
            >
              <Clock className="h-4 w-4 text-amber-600" />
              Предупреждение о таймере
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.error("Кукла уже забронирована другим ценителем", {
                  description: "Вы можете запросить создание похожей работы на заказ.",
                })
              }
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              Сообщение об ошибке
            </Button>
          </div>
        </section>

        {/* 6. Form Controls: Input, Textarea, Label, Checkbox, RadioGroup */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              6. Элементы форм (Input, Textarea, Checkbox, Radio)
            </h2>
            <p className="text-sm text-muted">
              Формы заказа, адреса Европочты и индивидуальных пожеланий.
            </p>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Имя и фамилия получателя</Label>
                <Input
                  id="customer-name"
                  placeholder="Анна Ковалева"
                  defaultValue="Алена Васильева"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Номер телефона (для СМС)</Label>
                <Input
                  id="customer-phone"
                  placeholder="+375 (29) 123-45-67"
                  defaultValue="+375 (29) 987-65-43"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-note">
                Пожелания по упаковке или гравировке на шкатулке
              </Label>
              <Textarea
                id="order-note"
                rows={3}
                placeholder="Напишите, если это подарок к особой дате или требуется подарочное оформление лентой..."
              />
            </div>

            <Separator />

            {/* Delivery Radio Group */}
            <div className="space-y-3">
              <Label>Способ доставки по Беларуси</Label>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={setDeliveryMethod}
              >
                <label
                  htmlFor="europost"
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-linen-dark hover:bg-linen/40 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value="europost" id="europost" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-espresso flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-terracotta" />
                      Европочта (до отделения) · 5 BYN
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Срок доставки 2–3 дня. СМС-уведомление при поступлении в ОПС.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="courier"
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-linen-dark hover:bg-linen/40 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value="courier" id="courier" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-espresso flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-sage" />
                      Курьерская доставка до двери (Минск) · 10 BYN
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Вручение лично в руки в согласованное удобное время.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Separator />

            {/* Terms checkbox */}
            <label
              htmlFor="agree-terms"
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              <Checkbox
                id="agree-terms"
                checked={agreementChecked}
                onCheckedChange={(checked) =>
                  setAgreementChecked(checked === true)
                }
              />
              <span className="text-xs text-muted leading-relaxed">
                Я подтверждаю согласие с условиями{" "}
                <Link
                  href="/legal/terms"
                  className="text-terracotta underline hover:text-terracotta-hover"
                >
                  публичной оферты
                </Link>{" "}
                и правилами обработки персональных данных согласно Закону РБ № 99-З.
              </span>
            </label>
          </div>
        </section>

        {/* 7. Tabs & Doll Card Preview */}
        <section className="space-y-6">
          <div className="border-t border-linen-dark pt-8">
            <h2 className="font-serif text-2xl font-normal text-espresso">
              7. Вкладки и карточка произведения (Tabs & Card)
            </h2>
            <p className="text-sm text-muted">
              Презентация куклы в каталоге и детальный просмотр характеристик.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Doll Card Preview */}
            <Card className="overflow-hidden group">
              <div className="relative aspect-[4/5] bg-linen overflow-hidden flex items-center justify-center">
                <div className="text-center p-6 space-y-2">
                  <Sparkles className="h-8 w-8 text-terracotta/60 mx-auto" />
                  <p className="font-serif text-xl text-espresso">
                    Фотография экспоната
                  </p>
                  <p className="text-xs text-muted">
                    Художественная фотосессия при естественном свете
                  </p>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant="available">В наличии</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="ooak">OOAK</Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle>«Селеста»</CardTitle>
                  <span className="text-xl font-medium text-terracotta font-sans">
                    55 BYN
                  </span>
                </div>
                <CardDescription>
                  Коллекция «Цветочные феи» · Хлопок макраме, фатин с ромашками, дерево
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-espresso-soft leading-relaxed line-clamp-2">
                  Нежная ручная роспись личика, воздушная юбка с вышитыми ромашками
                  и букетик незабудок в миниатюрных ладошках.
                </p>
              </CardContent>

              <CardFooter className="gap-2">
                <Button
                  className="flex-1"
                  onClick={() =>
                    toast.success("Бронь открыта!", {
                      description: "Перейдите в корзину для подтверждения.",
                    })
                  }
                >
                  <ShoppingBag className="h-4 w-4" />
                  Забронировать
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Tabs for Doll Details */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted">
                Табы информации о произведении
              </p>
              <Tabs defaultValue="story" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="story">История</TabsTrigger>
                  <TabsTrigger value="materials">Материалы</TabsTrigger>
                  <TabsTrigger value="delivery">Доставка</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="story"
                  className="rounded-xl border border-linen-dark bg-white p-5 text-sm text-espresso-soft space-y-3 leading-relaxed"
                >
                  <blockquote className="font-serif italic text-lg text-terracotta border-l-2 border-terracotta pl-3">
                    «Селеста хранит в ладошках букетик незабудок как символ искренности и вечной весны...»
                  </blockquote>
                  <p>
                    Фея одета в воздушное платье из мятного хлопка макраме и невесомого
                    фатина с вышитыми ромашками. На спинке — резные ажурные крылышки.
                  </p>
                </TabsContent>

                <TabsContent
                  value="materials"
                  className="rounded-xl border border-linen-dark bg-white p-5 text-sm space-y-2 leading-relaxed"
                >
                  <div className="flex justify-between py-1 border-b border-linen">
                    <span className="text-muted">Личико:</span>
                    <span className="font-medium">Бусина из светлого бука с ручной росписью</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-linen">
                    <span className="text-muted">Платье:</span>
                    <span className="font-medium">100% эко-хлопок макраме и фатин с ромашками</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-linen">
                    <span className="text-muted">Волосы:</span>
                    <span className="font-medium">Шелковистая хлопковая пряжа экрю</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted">Крылышки:</span>
                    <span className="font-medium">Натуральный шпон с ажурной перфорацией</span>
                  </div>
                </TabsContent>

                <TabsContent
                  value="delivery"
                  className="rounded-xl border border-linen-dark bg-white p-5 text-sm space-y-3 leading-relaxed"
                >
                  <p className="font-medium text-espresso flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-terracotta" />
                    Бережная подарочная упаковка
                  </p>
                  <p className="text-muted text-xs">
                    Фея бережно укладывается в крафтовую коробочку с воздушной бумагой
                    тишью, атласной лентой и авторской открыткой с теплыми пожеланиями.
                  </p>
                </TabsContent>
              </Tabs>

              {/* Skeletons Preview */}
              <div className="pt-4 space-y-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Скелетоны загрузки (Skeleton)
                </p>
                <div className="rounded-xl border border-linen-dark bg-white p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <footer className="border-t border-linen-dark pt-8 pb-16 text-center text-xs text-muted space-y-2">
          <p className="font-serif text-sm text-espresso">
            DollShop · OOAK Art Boutique & Gallery
          </p>
          <p>
            ИП Прокопенко А. В. · УНП 193758204 · Минск, Республика Беларусь
          </p>
        </footer>
      </div>
    </div>
  );
}
