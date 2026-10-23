import type { Metadata } from "next";
import QRCode from "qrcode";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DemoCenterClient } from "@/components/demo/DemoCenterClient";

export const metadata: Metadata = {
  title: "Центр интерактивного тестирования | DollShop",
  description:
    "Проверка всех реализованных фичей бутика авторских кукол DollShop с телефона и компьютера.",
  robots: { index: false, follow: false },
};

// Локальный IP-адрес машины в домашней Wi-Fi сети
const LAN_URL = process.env.NEXT_PUBLIC_APP_URL || "http://192.168.1.3:3001";

export default async function DemoPage() {
  // 1. Ищем куклу в наличии для быстрого тестирования
  const [doll] = await db
    .select({
      slug: products.slug,
      title: products.title,
    })
    .from(products)
    .where(eq(products.status, "available"))
    .limit(1);

  const initialDollSlug = doll?.slug || "fairytales-forest-fairy";
  const initialDollTitle = doll?.title || "Лесная Фея Незабудка";

  // 2. Генерируем QR-код для мгновенного перехода со смартфона
  let phoneQrDataUrl = "";
  try {
    phoneQrDataUrl = await QRCode.toDataURL(LAN_URL, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: {
        dark: "#2A2521",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Ошибка формирования QR-кода демо-центра:", err);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <DemoCenterClient
        phoneQrDataUrl={phoneQrDataUrl}
        lanUrl={LAN_URL}
        initialDollSlug={initialDollSlug}
        initialDollTitle={initialDollTitle}
      />
    </div>
  );
}
