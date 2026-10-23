import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { getDollBySlug } from "@/lib/data/catalog";

export const runtime = "nodejs";

export const alt = "Авторская интерьерная кукла ручной работы | DollShop";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Преобразование локального изображения в base64 data URI для встраивания в Satori.
 */
async function getBase64Image(relativePath: string): Promise<string | null> {
  try {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    const fullPath = join(process.cwd(), "public", cleanPath);
    const buffer = await readFile(fullPath);
    const ext = cleanPath.split(".").pop()?.toLowerCase() || "jpg";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const doll = await getDollBySlug(slug);

  // Загружаем шрифты бренда (Cormorant Garamond и Manrope)
  const [cormorantFontData, manropeFontData] = await Promise.all([
    readFile(
      join(process.cwd(), "src/assets/fonts/CormorantGaramond-SemiBold.ttf")
    ),
    readFile(join(process.cwd(), "src/assets/fonts/Manrope-SemiBold.ttf")),
  ]);

  if (!doll) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FAF8F5",
            fontFamily: "Manrope, sans-serif",
            padding: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 4,
              color: "#9A5B42",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            DOLLSHOP · АВТОРСКИЙ АРТ-БУТИК
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 64,
              color: "#1C1917",
              textAlign: "center",
            }}
          >
            Авторские интерьерные куклы
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#78716C",
              marginTop: 20,
            }}
          >
            Минск, Беларусь · Доставка почтой по всей стране
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Cormorant Garamond",
            data: cormorantFontData,
            style: "normal",
            weight: 600,
          },
          {
            name: "Manrope",
            data: manropeFontData,
            style: "normal",
            weight: 600,
          },
        ],
      }
    );
  }

  // Подготовка фото куклы
  const coverImage = doll.images.find((img) => img.isCover) || doll.images[0];
  let photoDataUri: string | null = null;
  if (coverImage?.url) {
    if (coverImage.url.startsWith("/")) {
      photoDataUri = await getBase64Image(coverImage.url);
    } else if (coverImage.url.startsWith("http")) {
      photoDataUri = coverImage.url;
    }
  }

  // Статус куклы
  let statusText = "В НАЛИЧИИ · 1 ЭКЗЕМПЛЯР (OOAK)";
  let statusBg = "#EDF2EE";
  let statusColor = "#4A5D4E";

  if (doll.status === "reserved") {
    statusText = "ВРЕМЕННО ЗАБРОНИРОВАНА";
    statusBg = "#FEF3C7";
    statusColor = "#92400E";
  } else if (doll.status === "sold") {
    statusText = "ПРОДАНА · АРХИВ";
    statusBg = "#F3F4F6";
    statusColor = "#6B7280";
  } else if (doll.status === "in_progress") {
    statusText = "В ПРОЦЕССЕ СОЗДАНИЯ";
    statusBg = "#EFF6FF";
    statusColor = "#1D4ED8";
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#FAF8F5",
          fontFamily: "Manrope, sans-serif",
          padding: "48px",
          boxSizing: "border-box",
        }}
      >
        {/* Карточка-контейнер с мягкой фирменной каймой */}
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#FFFFFF",
            borderRadius: "32px",
            border: "1px solid #EAE4D8",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(28, 25, 23, 0.05)",
          }}
        >
          {/* Левая колонка: Фотография куклы */}
          <div
            style={{
              width: "440px",
              height: "100%",
              display: "flex",
              backgroundColor: "#F3EFE6",
              position: "relative",
            }}
          >
            {photoDataUri ? (
              <img
                src={photoDataUri}
                alt={doll.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9A5B42",
                  fontSize: 28,
                  fontFamily: "Cormorant Garamond, serif",
                }}
              >
                {doll.name}
              </div>
            )}
          </div>

          {/* Правая колонка: Детали, цена, статус и бренд */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "48px 56px",
            }}
          >
            {/* Верхняя строка: Бренд и статус */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  letterSpacing: 2,
                  color: "#9A5B42",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                DOLLSHOP · АРТ-БУТИК
              </div>

              <div
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  backgroundColor: statusBg,
                  color: statusColor,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                {statusText}
              </div>
            </div>

            {/* Центральная часть: Имя, серия, описание */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {doll.collection || "Авторская серия"} · Рост {doll.heightCm} см
              </div>

              <div
                style={{
                  display: "flex",
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 54,
                  fontWeight: 600,
                  color: "#1C1917",
                  lineHeight: 1.05,
                }}
              >
                {doll.name}
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "#57534E",
                  lineHeight: 1.4,
                  marginTop: "6px",
                }}
              >
                {doll.materials && doll.materials.length > 0
                  ? `Материалы: ${doll.materials.slice(0, 3).join(", ")}.`
                  : "Натуральный хлопок макраме, дерево, фатин с вышивкой."}
              </div>
            </div>

            {/* Нижняя часть: Стоимость в BYN и плашка доставки */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                borderTop: "1px solid #F3EFE6",
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 13,
                    color: "#78716C",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Стоимость куклы
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 42,
                    fontWeight: 600,
                    color: "#9A5B42",
                    lineHeight: 1.1,
                  }}
                >
                  {doll.priceByn} BYN
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  color: "#78716C",
                  fontSize: 14,
                }}
              >
                <div style={{ display: "flex", color: "#1C1917", fontWeight: 600 }}>
                  Почта по Беларуси или самовывоз
                </div>
                <div style={{ display: "flex", marginTop: "2px" }}>
                  dollshop.by · Минск
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cormorant Garamond",
          data: cormorantFontData,
          style: "normal",
          weight: 600,
        },
        {
          name: "Manrope",
          data: manropeFontData,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
