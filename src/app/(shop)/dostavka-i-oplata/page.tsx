import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  CreditCard,
  Package,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { LegalInfo } from "@/components/layout/LegalInfo";

export const metadata: Metadata = {
  title: "Доставка и оплата | DollShop (Беларусь)",
  description:
    "Условия доставки Европочтой по всей Беларуси, надежная подарочная упаковка и способы оплаты (наложенный платеж, онлайн в BYN).",
};

export default function DeliveryAndPaymentPage() {
  return (
    <div className="py-10 sm:py-16 bg-alabaster">
      <Container className="max-w-4xl space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-linen-dark bg-linen px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Truck className="h-3.5 w-3.5 text-terracotta" />
            <span>Информация для покупателей</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-espresso">
            Доставка и оплата
          </h1>

          <p className="text-base text-muted leading-relaxed">
            Мы бережно отправляем авторских интерьерных фей во все города и
            населенные пункты Республики Беларусь через сервис «Европочта».
          </p>
        </div>

        {/* 1. Delivery Section */}
        <section className="space-y-6">
          <div className="border-b border-linen-dark pb-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-espresso flex items-center gap-2.5">
              <Truck className="h-6 w-6 text-terracotta" />
              <span>1. Доставка по Беларуси</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Europost Office */}
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-terracotta-subtle px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                  Популярный выбор
                </span>
                <span className="font-semibold text-espresso text-base">~5 BYN</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                До отделения Европочты (ОПС)
              </h3>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
                <li>Срок доставки: <strong>2–3 рабочих дня</strong> с момента отправки.</li>
                <li>Более 500 отделений по всей Беларуси (Минск, областные и районные центры).</li>
                <li>СМС-уведомление и Viber-сообщение о прибытии посылки.</li>
                <li>Срок бесплатного хранения в отделении: 7 календарных дней.</li>
              </ul>
            </div>

            {/* Courier Delivery */}
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-sage-subtle px-2.5 py-0.5 text-xs font-semibold text-sage-dark">
                  До двери
                </span>
                <span className="font-semibold text-espresso text-base">~10 BYN</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Курьерская доставка Европочтой
              </h3>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
                <li>Доставка курьером лично в руки по указанному адресу.</li>
                <li>Предварительный звонок курьера для согласования времени.</li>
                <li>Срок доставки: 2–4 рабочих дня.</li>
                <li>Возможность оплаты курьеру при вручении картой или наличными.</li>
              </ul>
            </div>
          </div>

          {/* Tracking notice */}
          <div className="rounded-xl bg-linen/60 border border-linen-dark p-4 flex items-start gap-3 text-xs text-muted leading-relaxed">
            <Clock className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
            <div>
              <strong className="text-espresso">Трек-номер посылки:</strong> Высылается
              покупателю сразу после оформления отправления в СМС-сообщении или
              Telegram. Вы всегда можете отследить статус на официальном сайте
              Европочты (evropochta.by).
            </div>
          </div>
        </section>

        {/* 2. Packaging Section */}
        <section className="space-y-6">
          <div className="border-b border-linen-dark pb-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-espresso flex items-center gap-2.5">
              <Package className="h-6 w-6 text-sage" />
              <span>2. Подарочная и защитная упаковка</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 space-y-4 shadow-xs">
            <p className="text-sm text-espresso leading-relaxed">
              Каждая авторская кукла уникальна и хрупка, поэтому процесс упаковки
              состоит из двух уровней защиты:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 p-3 rounded-xl bg-alabaster border border-linen">
                <span className="text-xs font-semibold text-terracotta block">
                  1. Подарочная коробка
                </span>
                <p className="text-xs text-muted">
                  Плотная крафтовая коробка, воздушная бумага тишью и атласная лента.
                  Готово для подарка близкому человеку.
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-alabaster border border-linen">
                <span className="text-xs font-semibold text-sage-dark block">
                  2. Авторский паспорт
                </span>
                <p className="text-xs text-muted">
                  В комплекте открытка с именем феи, датой создания, использованными
                  материалами и личной подписью мастера.
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-alabaster border border-linen">
                <span className="text-xs font-semibold text-espresso block">
                  3. Транспортная броня
                </span>
                <p className="text-xs text-muted">
                  Внешний гофрокороб с воздушно-пузырьковой пленкой исключает
                  любые повреждения при транспортировке.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Payment Methods */}
        <section className="space-y-6">
          <div className="border-b border-linen-dark pb-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-espresso flex items-center gap-2.5">
              <CreditCard className="h-6 w-6 text-terracotta" />
              <span>3. Способы оплаты (BYN)</span>
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Все расчеты осуществляются исключительно в национальной валюте Республики
              Беларусь — <strong>белорусских рублях (BYN)</strong> в соответствии
              с законодательством РБ.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-linen-dark bg-white p-5 space-y-2">
                <h4 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Оплата при получении (Наложенный платёж)</span>
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Оплата производится непосредственно в отделении Европочты или
                  курьеру при вручении заказа. Доступна оплата наличными деньгами
                  или банковскими картами любых белорусских банков (БЕЛКАРТ, Visa,
                  Mastercard, Мир).
                </p>
              </div>

              <div className="rounded-2xl border border-linen-dark bg-white p-5 space-y-2">
                <h4 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-terracotta" />
                  <span>Онлайн-оплата на сайте</span>
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Безопасная оплата банковской картой онлайн через защищенный платежный
                  шлюз белорусского банка-эквайера. Данные карты защищены по стандарту
                  PCI DSS. Электронный чек отправляется на указанный e-mail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Return and Warranty */}
        <section className="space-y-4 rounded-2xl border border-linen-dark bg-white p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-xl font-medium text-espresso flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-terracotta" />
            <span>Возврат и гарантия целостности</span>
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Пожалуйста, проверяйте целостность внешней упаковки и комплектность работы
            при получении в отделении Европочты. В соответствии со ст. 28 Закона
            Республики Беларусь «О защите прав потребителей» вы имеете право на
            возврат или обмен товара ненадлежащего качества. Авторские изделия
            надлежащего качества, изготовленные по индивидуальному заказу (с
            индивидуально-определенными свойствами), обмену и возврату не подлежат.
          </p>
        </section>

        {/* 5. Requisites */}
        <LegalInfo />

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Button asChild size="lg" className="rounded-full shadow-sm px-8">
            <Link href="/kukly">
              Перейти к выбору кукол в наличии
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
