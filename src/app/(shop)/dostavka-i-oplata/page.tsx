import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  CreditCard,
  Package,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { LegalInfo } from "@/components/layout/LegalInfo";
import { getSiteSettings } from "@/lib/data/drizzle/catalog";

export const metadata: Metadata = {
  title: "Почта и самовывоз, оплата | DollShop (Беларусь)",
  description:
    "Условия отправки посылок почтой по всей Беларуси, бесплатный самовывоз в Минске, надежная подарочная упаковка и способы оплаты (наложенный платеж, ЕРИП, онлайн в BYN).",
};

export default async function DeliveryAndPaymentPage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-10 sm:py-16 bg-alabaster">
      <Container className="max-w-4xl space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-linen-dark bg-linen px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Mail className="h-3.5 w-3.5 text-terracotta" />
            <span>Информация для покупателей</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-espresso">
            Почта, самовывоз и оплата
          </h1>

          <p className="text-base text-muted leading-relaxed">
            Мы бережно отправляем авторских интерьерных фей почтой по всей Республике
            Беларусь, а также передаем работы лично при самовывозе в Минске.
          </p>
        </div>

        {/* 1. Fulfillment Methods Section */}
        <section className="space-y-6">
          <div className="border-b border-linen-dark pb-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-espresso flex items-center gap-2.5">
              <Mail className="h-6 w-6 text-terracotta" />
              <span>1. Способы получения заказа</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Postal Dispatch */}
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-terracotta-subtle px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                  По всей Беларуси
                </span>
                <span className="font-semibold text-espresso text-base">
                  {settings.deliveryCostBranch} BYN (бесплатно от {settings.freeDeliveryThreshold} BYN)
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                Отправление почтой
              </h3>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
                <li>Срок пересылки: <strong>2–4 рабочих дня</strong> с момента отправки.</li>
                <li>Посылки отправляются в любое отделение почтовой связи по всей Беларуси.</li>
                <li>СМС-уведомление о поступлении посылки в ваше отделение.</li>
                <li>Отслеживание по индивидуальному трек-номеру на каждом этапе пути.</li>
              </ul>
            </div>

            {/* Self-pickup */}
            <div className="rounded-2xl border border-linen-dark bg-white p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-sage-subtle px-2.5 py-0.5 text-xs font-semibold text-sage-dark">
                  г. Минск
                </span>
                <span className="font-semibold text-espresso text-base">Бесплатно</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso flex items-center gap-1.5">
                <MapPin className="h-5 w-5 text-sage" />
                <span>Самовывоз в Минске</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
                <li>Бесплатно из мастерской в Минске по предварительной договоренности.</li>
                <li>Дата и удобное время передачи согласуются с мастером лично (Telegram/звонок).</li>
                <li>Возможность рассмотреть куклу вживую при передаче.</li>
                <li>Бережная упаковка в крафтовую коробку и подарочный пакет.</li>
              </ul>
            </div>
          </div>

          {/* Tracking notice */}
          <div className="rounded-xl bg-linen/60 border border-linen-dark p-4 flex items-start gap-3 text-xs text-muted leading-relaxed">
            <Clock className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
            <div>
              <strong className="text-espresso">Трек-номер почтового отправления:</strong> Высылается
              покупателю сразу после оформления посылки в СМС-сообщении или
              Telegram. Вы всегда можете отследить статус отправления онлайн.
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
                  3. Защитная броня
                </span>
                <p className="text-xs text-muted">
                  Внешний гофрокороб с воздушно-пузырьковой пленкой исключает
                  любые повреждения при пересылке почтой.
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
                  <span>Оплата при получении (Наложенный платёж / самовывоз)</span>
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Оплата производится в отделении почтовой связи при получении посылки
                  или при самовывозе в Минске. Доступна оплата наличными деньгами
                  или банковскими картами (БЕЛКАРТ, Visa, Mastercard, Мир).
                </p>
              </div>

              <div className="rounded-2xl border border-linen-dark bg-white p-5 space-y-2">
                <h4 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-terracotta" />
                  <span>ЕРИП и онлайн-оплата</span>
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Оплата через систему «Расчет» (ЕРИП) по номеру счета или банковской картой
                  онлайн через защищенный платежный шлюз белорусского банка. Электронный чек
                  высылается на указанный e-mail.
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
            Пожалуйста, проверяйте целостность упаковки и комплектность работы
            при получении в отделении почты или при самовывозе. В соответствии со ст. 28 Закона
            Республики Беларусь «О защите прав потребителей» вы имеете право на
            возврат или обмен товара ненадлежащего качества. Авторские изделия
            надлежащего качества, изготовленные по индивидуальному заказу (с
            индивидуально-определенными свойствами), обмену и возврату не подлежат.
          </p>
        </section>

        {/* 5. Requisites */}
        <LegalInfo settings={settings} />

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
