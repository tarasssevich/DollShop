import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Mail,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { BuyButton } from "@/components/shop/BuyButton";
import { ProductStory } from "@/components/shop/ProductStory";
import { SpecsCard } from "@/components/shop/SpecsCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDollBySlug, getDolls } from "@/lib/data/catalog";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = true;

/**
 * Pre-generate static routes for all published dolls.
 */
export async function generateStaticParams() {
  const dolls = await getDolls();
  return dolls.map((doll) => ({
    slug: doll.slug,
  }));
}

/**
 * Generate SEO-rich metadata for the doll detail page.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doll = await getDollBySlug(slug);

  if (!doll) {
    return {
      title: "Кукла не найдена | DollShop",
      description: "Запрошенное авторское произведение не найдено в каталоге.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";

  return {
    title: `${doll.name} (${doll.priceByn} BYN) · Кукла ручной работы | DollShop`,
    description: doll.description,
    alternates: {
      canonical: `${baseUrl}/kukly/${doll.slug}`,
    },
    openGraph: {
      title: `${doll.name} · Авторская интерьерная фея ручной работы (${doll.priceByn} BYN)`,
      description: doll.description,
      type: "website",
      locale: "ru_BY",
      url: `${baseUrl}/kukly/${doll.slug}`,
      siteName: "DollShop",
    },
    twitter: {
      card: "summary_large_image",
      title: `${doll.name} · Кукла ручной работы (${doll.priceByn} BYN)`,
      description: doll.description,
    },
  };
}

export default async function DollDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const doll = await getDollBySlug(slug);

  if (!doll) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
  const breadcrumbs = [
    { name: "Главная", url: `${baseUrl}/` },
    { name: "Куклы в наличии", url: `${baseUrl}/kukly` },
    { name: doll.name, url: `${baseUrl}/kukly/${doll.slug}` },
  ];

  // Related dolls recommendation
  const allDolls = await getDolls();
  const relatedDolls = allDolls
    .filter(
      (d) =>
        d.slug !== slug &&
        Array.isArray(d.images) &&
        d.images.length > 0 &&
        Boolean(d.images[0]?.url)
    )
    .slice(0, 3);

  return (
    <div className="bg-alabaster pb-24 sm:pb-16 pt-4 sm:pt-6">
      {/* Schema.org SEO Structured Data */}
      <ProductJsonLd doll={doll} baseUrl={baseUrl} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <Container className="space-y-6 sm:space-y-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Навигация по сайту"
          className="flex items-center gap-1.5 text-xs text-muted"
        >
          <Link
            href="/"
            className="hover:text-terracotta transition-colors"
          >
            Главная
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href="/kukly"
            className="hover:text-terracotta transition-colors"
          >
            Куклы в наличии
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-espresso font-medium truncate max-w-[200px] sm:max-w-none">
            {doll.name}
          </span>
        </nav>

        {/* Primary 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Gallery (Sticky on desktop) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <ProductGallery
              images={doll.images}
              dollName={doll.name}
              status={doll.status}
              reservedUntil={doll.reservedUntil}
            />
          </div>

          {/* Right Column: Information, Purchase CTA, Story & Specs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted font-semibold">
                <span>{doll.collection || "Авторская серия"}</span>
                <span>·</span>
                <span>{doll.heightCm} см</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-espresso leading-tight">
                {doll.name}
              </h1>

              <p className="text-sm text-muted leading-relaxed">
                {doll.description}
              </p>
            </div>

            {/* In-page Buy Button & Reservation widget */}
            <BuyButton doll={doll} />

            {/* Delivery & Care Tabs */}
            <div className="rounded-2xl border border-linen-dark bg-white p-5 sm:p-6 space-y-4">
              <Tabs defaultValue="delivery" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="delivery" className="text-xs">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Почта и самовывоз
                  </TabsTrigger>
                  <TabsTrigger value="care" className="text-xs">
                    <HeartHandshake className="h-3.5 w-3.5 mr-1.5" />
                    Бережный уход
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="delivery"
                  className="space-y-2.5 pt-3 text-xs text-muted leading-relaxed"
                >
                  <p className="text-espresso font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-sage" />
                    Посылка почтой по Беларуси или самовывоз в Минске
                  </p>
                  <ul className="space-y-1.5 pl-5 list-disc text-muted">
                    <li>
                      <strong>Почта по всей Беларуси:</strong> 2–4 рабочих дня
                      с трек-номером до любого отделения связи (~3,50–5 BYN).
                    </li>
                    <li>
                      <strong>Самовывоз в Минске:</strong> бесплатно из мастерской
                      по предварительной договоренности.
                    </li>
                    <li>
                      <strong>Надежная упаковка:</strong> фея укладывается в
                      жесткую крафтовую коробку с защитным наполнителем тишью и авторским паспортом.
                    </li>
                  </ul>
                </TabsContent>

                <TabsContent
                  value="care"
                  className="space-y-2 pt-3 text-xs text-muted leading-relaxed"
                >
                  <p className="text-espresso font-medium">
                    Как сохранить первозданную красоту куклы:
                  </p>
                  <ul className="space-y-1.5 pl-5 list-disc text-muted">
                    <li>
                      Кукла предназначена для интерьерного оформления дома или
                      детской комнаты (не игрушка для малышей).
                    </li>
                    <li>
                      Избегайте прямого контакта с водой и длительного воздействия
                      ярких солнечных лучей.
                    </li>
                    <li>
                      При необходимости бережно расправьте нити хлопкового платья и
                      фатин чистыми сухими руками.
                    </li>
                  </ul>
                </TabsContent>
              </Tabs>
            </div>

            {/* Literary Story Component */}
            <ProductStory
              name={doll.name}
              story={doll.story}
              description={doll.description}
              collection={doll.collection}
            />

            {/* Detailed Technical Specifications Card */}
            <SpecsCard doll={doll} />
          </div>
        </div>

        {/* Related Dolls Recommendation Section */}
        {relatedDolls.length > 0 && (
          <section className="border-t border-linen-dark pt-12 sm:pt-16 space-y-6">
            <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                  Вам также может понравиться
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-light text-espresso mt-0.5">
                  Другие работы мастера
                </h2>
              </div>
              <Link
                href="/kukly"
                className="inline-flex items-center text-xs font-semibold text-terracotta hover:underline gap-1"
              >
                Все работы в наличии
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedDolls.map((item) => (
                <ProductCard key={item.id} doll={item} />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Sticky Mobile Purchase Action Bar */}
      <BuyButton doll={doll} isStickyMobile />
    </div>
  );
}
