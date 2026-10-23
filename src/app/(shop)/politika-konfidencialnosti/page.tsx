import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LegalInfo } from "@/components/layout/LegalInfo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности (Закон № 99-З) | DollShop (Беларусь)",
  description:
    "Политика оператора в отношении обработки персональных данных в соответствии с Законом Республики Беларусь № 99-З «О защите персональных данных».",
};

export default function PrivacyPolicyPage() {
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
            <span>Закон Республики Беларусь № 99-З</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-espresso">
            Политика в отношении обработки персональных данных
          </h1>

          <p className="text-xs text-muted leading-relaxed">
            Утверждена 15 января 2024 года · г. Минск, Республика Беларусь
          </p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-sage-subtle border border-sage/30 p-4 flex items-start gap-3 text-xs text-sage-dark leading-relaxed">
          <Lock className="h-4 w-4 text-sage shrink-0 mt-0.5" />
          <div>
            <strong>Правовая основа:</strong> Настоящая Политика определяет порядок
            сбора, хранения и защиты персональных данных в соответствии с Законом
            Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных
            данных».
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
              персональных данных, является Индивидуальный предприниматель
              Прокопенко Алёна Васильевна (УНП 193758204, адрес: 220030, г. Минск,
              ул. Ленина, д. 14, адрес электронной почты:{" "}
              <strong>info@dollshop.by</strong>).
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
                Организация почтовой доставки отправлений через оператора «Европочта»;
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
              3. Перечень обрабатываемых персональных данных
            </h2>
            <p>
              3.1. Для выполнения указанных целей Оператор запрашивает строго
              минимально необходимый объем данных:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Фамилия, собственное имя, отчество (при наличии) получателя;</li>
              <li>Контактный номер телефона (формат операторов связи РБ +375);</li>
              <li>Адрес доставки / номер выбранного отделения связи «Европочта»;</li>
              <li>Никнейм в мессенджере (Telegram / Viber) — при добровольном указании.</li>
            </ul>
            <p>
              3.2. Оператор <strong>не обрабатывает</strong> специальные персональные
              данные (расовая принадлежность, биометрические данные, сведения о
              здоровье) и данные банковских карт (обработка платежей осуществляется
              на стороне сертифицированного банка-эквайера).
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              4. Порядок хранения и передача третьим лицам
            </h2>
            <p>
              4.1. В соответствии с Указом Президента Республики Беларусь № 60,
              все базы данных и серверная инфраструктура интернет-магазина физически
              размещены на территории Республики Беларусь (дата-центр hoster.by).
            </p>
            <p>
              4.2. Персональные данные передаются исключительно уполномоченному
              почтовому оператору (ЗАО «Интернет-магазин Евроопт», сервис «Европочта»)
              в объеме, строго необходимом для вручения посылки адресату.
            </p>
            <p>
              4.3. Персональные данные никогда не передаются рекламным агентствам,
              брокерам данных или посторонним третьим лицам.
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
              <strong>info@dollshop.by</strong>. Заявление рассматривается в срок
              до 15 календарных дней.
            </p>
          </section>
        </article>

        {/* Requisites */}
        <LegalInfo />
      </Container>
    </div>
  );
}
