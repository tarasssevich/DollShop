import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LegalInfo } from "@/components/layout/LegalInfo";
import { getSiteSettings } from "@/lib/data/drizzle/catalog";

export const metadata: Metadata = {
  title: "Политика конфиденциальности и персональных данных | DollShop (Закон № 99-З)",
  description:
    "Политика в отношении обработки персональных данных интернет-магазина авторских кукол DollShop в соответствии с Законом Республики Беларусь № 99-З.",
};

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const sellerName = settings.legalSellerName || "Индивидуальный предприниматель Прокопенко Алёна Васильевна";
  const unp = settings.legalUnp || "193758204";
  const address = settings.legalAddress || "220030, г. Минск, ул. Ленина, д. 14";
  const contactEmail = settings.contactEmail || "info@dollshop.by";

  return (
    <div className="py-10 sm:py-16 bg-alabaster">
      <Container className="max-w-3xl space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-muted hover:text-terracotta transition-colors gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Вернуться на главную</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-linen-dark bg-linen px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-sage" />
            <span>Защита персональных данных</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-espresso">
            Политика в отношении обработки персональных данных
          </h1>

          <p className="text-xs text-muted leading-relaxed">
            Разработана в строгом соответствии с Законом Республики Беларусь от 7 мая 2021 г. № 99-З
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Важно для покупателей:</strong> Мы уважаем вашу
            конфиденциальность, собираем минимально необходимый объем данных для
            доставки кукол почтой по Беларуси и никогда не передаем ваши контакты
            третьим лицам в рекламных целях.
          </div>
        </div>

        {/* Policy Text */}
        <article className="prose prose-stone prose-sm max-w-none space-y-8 text-espresso-soft leading-relaxed text-xs sm:text-sm">
          {/* 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              1. Сведения об операторе
            </h2>
            <p>
              1.1. Оператором, организующим и осуществляющим обработку
              персональных данных, является {sellerName} (УНП {unp}, адрес: {address}, адрес электронной почты:{" "}
              <strong>{contactEmail}</strong>).
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              2. Цели обработки персональных данных
            </h2>
            <p>
              2.1. Оператор осуществляет обработку персональных данных
              исключительно в следующих законных целях:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Оформление и исполнение договора розничной купли-продажи авторских
                изделий;
              </li>
              <li>
                Организация отправки почтовых отправлений через оператора почтовой связи либо организация самовывоза;
              </li>
              <li>
                Информирование Покупателя о статусе бронирования и отправки посылки
                по каналам связи (СМС, Telegram, Viber, звонок);
              </li>
              <li>
                Обработка индивидуальных запросов на создание кукол по мотивам
                архива.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              3. Объем обрабатываемых персональных данных
            </h2>
            <p>
              3.1. Для оформления заказа и отправки посылки обрабатываются:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Фамилия, собственное имя, отчество (при наличии) получателя;</li>
              <li>Номер контактного телефона;</li>
              <li>Почтовый адрес доставки (индекс, населенный пункт, улица, дом, квартира);</li>
              <li>Адрес электронной почты (при указании для получения электронного чека).</li>
            </ul>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              4. Срок хранения персональных данных
            </h2>
            <p>
              4.1. Персональные данные хранятся в течение срока, необходимого для
              достижения целей обработки, но не менее сроков, установленных
              законодательством Республики Беларусь об архивном деле и бухгалтерском учете.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              5. Права субъекта персональных данных
            </h2>
            <p>
              5.1. В соответствии со статьями 10–14 Закона № 99-З субъект
              персональных данных имеет право:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Отозвать согласие на обработку персональных данных;</li>
              <li>Получить информацию о предоставлении своих данных третьим лицам;</li>
              <li>
                Требовать изменения неточных персональных данных либо прекращения
                их обработки и полного удаления.
              </li>
            </ul>
            <p>
              5.2. Для реализации прав субъект данных может направить письменное
              заявление по почтовому адресу Оператора либо в электронном виде на{" "}
              <strong>{contactEmail}</strong>. Заявление рассматривается в срок
              до 15 календарных дней.
            </p>
          </section>
        </article>

        {/* Requisites */}
        <LegalInfo settings={settings} />
      </Container>
    </div>
  );
}
