import type { Metadata } from "next";
import Link from "next/link";
import { FileText, AlertCircle, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LegalInfo } from "@/components/layout/LegalInfo";

export const metadata: Metadata = {
  title: "Публичная оферта | DollShop (Республика Беларусь)",
  description:
    "Публичный договор купли-продажи авторских изделий ручной работы интернет-магазина DollShop (ИП Прокопенко А. В., Минск).",
};

export default function OfertaPage() {
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
            <FileText className="h-3.5 w-3.5 text-terracotta" />
            <span>Официальный юридический документ</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-espresso">
            Публичная оферта
          </h1>

          <p className="text-xs text-muted leading-relaxed">
            Редакция действует с 15 января 2024 года · г. Минск, Республика Беларусь
          </p>
        </div>

        {/* Legal Disclaimer Note */}
        <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Юридическое примечание:</strong> Настоящий документ является
            проектом публичного договора розничной купли-продажи в соответствии со
            статьями 405 и 407 Гражданского кодекса Республики Беларусь и Законом
            РБ «О защите прав потребителей».
          </div>
        </div>

        {/* Longform Legal Text */}
        <article className="prose prose-stone prose-sm max-w-none space-y-8 text-espresso-soft leading-relaxed text-xs sm:text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              1. Общие положения и стороны договора
            </h2>
            <p>
              1.1. Настоящий документ представляет собой официальное публичное
              предложение (публичную оферту) Индивидуального предпринимателя
              Прокопенко Алёны Васильевны (УНП 193758204, свидетельство о гос.
              регистрации выдано Минским горисполкомом 15.01.2024 г., регистрационный
              номер в Торговом реестре Республики Беларусь: № 584920 от 12.03.2024 г.),
              именуемой в дальнейшем «Продавец», заключить договор розничной
              купли-продажи авторских изделий на условиях, изложенных ниже.
            </p>
            <p>
              1.2. В соответствии со статьей 407 Гражданского кодекса Республики
              Беларусь текст настоящего документа является публичной офертой.
              Оформление Заказа на сайте интернет-магазина <strong>dollshop.by</strong>{" "}
              является полным и безоговорочным акцептом настоящей Оферты.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              2. Предмет договора и специфика товара
            </h2>
            <p>
              2.1. Продавец обязуется передать в собственность Покупателю, а
              Покупатель обязуется оплатить и принять авторские интерьерные
              куклы-феи, ангелов и текстильный декор ручной работы (далее — «Товар»),
              представленные на сайте.
            </p>
            <p>
              2.2. Каждый представленный Товар является произведением ручной
              работы, созданным в единственном экземпляре (OOAK — One Of A Kind).
              Незначительные отличия фактуры натурального дерева, оттенков нитей и
              расположения вышивки на фатине обусловлены природой ручного труда и не
              являются дефектом или браком.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              3. Порядок оформления заказа и временное бронирование
            </h2>
            <p>
              3.1. Заказ оформляется Покупателем самостоятельно на сайте{" "}
              <strong>dollshop.by</strong> через корзину.
            </p>
            <p>
              3.2. Ввиду уникальности каждого произведения (единственный экземпляр),
              при нажатии кнопки «Забронировать» Товар фиксируется за Покупателем
              на срок <strong>15 (пятнадцать) минут</strong>. Если в течение
              указанного времени оформление заказа не завершено, бронь аннулируется
              автоматически, и Товар возвращается в открытый каталог.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              4. Цена товара и порядок расчетов
            </h2>
            <p>
              4.1. Цены на все Товары на сайте указаны в национальной валюте
              Республики Беларусь — <strong>белорусских рублях (BYN)</strong>.
            </p>
            <p>
              4.2. Оплата Товара может осуществляться следующими способами:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Наложенным платежом при получении отправления в отделении
                «Европочта» наличными денежными средствами или банковской картой;
              </li>
              <li>
                Онлайн-оплатой банковской картой через авторизованный платежный шлюз
                в белорусских рублях в момент оформления заказа.
              </li>
            </ul>
            <p>
              4.3. Стоимость доставки оператором «Европочта» рассчитывается
              согласно действующим тарифам оператора и оплачивается Покупателем.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              5. Доставка и передача товара
            </h2>
            <p>
              5.1. Доставка осуществляется почтовым оператором «Европочта» по всей
              территории Республики Беларусь до выбранного отделения почтовой связи
              (ОПС) либо курьером по указанному адресу.
            </p>
            <p>
              5.2. Срок доставки составляет от 2 до 4 рабочих дней с момента
              передачи отправления в службу доставки. Продавец обязуется передать
              заказ в службу доставки в течение 1–2 рабочих дней с момента подтверждения.
            </p>
            <p>
              5.3. Риск случайной гибели или повреждения Товара переходит к Покупателю
              в момент вручения Товара в отделении связи или курьером.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-espresso">
              6. Возврат и обмен авторских изделий
            </h2>
            <p>
              6.1. Права Покупателя регулируются Законом Республики Беларусь от
              9 января 2002 г. № 90-З «О защите прав потребителей».
            </p>
            <p>
              6.2. В случае выявления производственного дефекта Покупатель вправе
              обратиться к Продавцу по адресу <strong>info@dollshop.by</strong> с
              фотографиями дефекта в течение 14 календарных дней с момента получения.
            </p>
            <p>
              6.3. Изделия надлежащего качества, изготовленные по индивидуальному
              заказу (персональные размеры, цвета, вышивка), обмену и возврату не
              подлежат в соответствии с законодательством Республики Беларусь.
            </p>
          </section>
        </article>

        {/* Requisites */}
        <LegalInfo />
      </Container>
    </div>
  );
}
