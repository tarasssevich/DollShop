import { db, client } from "@/db/client";
import { products, productMedia, reservations } from "@/db/schema";
import { eq, inArray, notInArray, like, or } from "drizzle-orm";
import crypto from "crypto";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0VGRTYiLz48L3N2Zz4=";

export const AVAILABLE_DOLLS = [
  {
    slug: "selesta",
    title: "Селеста · Фея незабудок",
    category: "fairies",
    collection: "Цветочные феи",
    price: "55.00",
    heightCm: 20,
    materials: [
      "100% хлопковая пряжа макраме",
      "Натуральное дерево (точеная бусина)",
      "Резные деревянные крылья бабочки",
      "Воздушный ромашковый фатин",
      "Мини-букетик лазурных незабудок",
    ],
    description:
      "Нежная интерьерная фея ручной работы. Мятно-бирюзовое платье из хлопковых нитей и ромашкового фатина, резные деревянные крылышки и крошечный букетик незабудок в руках.",
    story:
      "Селеста создана из мягких хлопковых нитей, тончайшего фатина и частички лета. Она держит в ручках букетик незабудок и хранит в доме атмосферу сказки, тепла и беззаботной радости.",
    specs: {
      height_cm: 20,
      materials: [
        "100% хлопковая пряжа макраме",
        "Натуральное дерево",
        "Резные крылья бабочки",
        "Ромашковый фатин",
        "Мини-букетик незабудок",
      ],
      collection: "Цветочные феи",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/fairy-blue-1.jpg",
        alt: "Авторская кукла-фея Селеста ручной работы — студийное фото в полный рост",
        displayOrder: 0,
      },
      {
        url: "/mock/dolls/fairy-blue-2.jpg",
        alt: "Портрет куклы-феи Селеста крупным планом: деревянное личико и букет незабудок",
        displayOrder: 1,
      },
    ],
  },
  {
    slug: "semeynoe-schastye",
    title: "Панно „Семейное счастье“ на качелях",
    category: "fairies",
    collection: "Семейные обереги",
    price: "68.00",
    heightCm: 26,
    materials: [
      "100% эко-хлопок макраме",
      "Натуральное светлое дерево",
      "Вязаное солнышко",
      "Цветочный венок ручной работы",
      "Морские ракушки и джут",
    ],
    description:
      "Тёплое интерьерное настенное панно-оберег для семейного уюта: папа, мама и дочка на канатных качелях под тёплым солнышком с корабликом семейного счастья.",
    story:
      "Это панно создано как символ домашнего тепла, согласия и бесконечной любви. Вся семья вместе на качелях, окруженная цветами, морем и лучами солнца. Идеальный подарок на свадьбу, годовщину или новоселье.",
    specs: {
      height_cm: 26,
      materials: [
        "Эко-хлопок макраме",
        "Натуральное светлое дерево",
        "Вязаное солнышко",
        "Цветочный венок",
        "Ракушки и джут",
      ],
      collection: "Семейные обереги",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-family.jpg",
        alt: "Интерьерное настенное панно Семейное счастье на качелях — ручная работа",
        displayOrder: 0,
      },
    ],
  },
  {
    slug: "rusalochka-ariel",
    title: "Панно „Русалочка Ариэль“",
    category: "fairies",
    collection: "Морские сказки",
    price: "58.00",
    heightCm: 24,
    materials: [
      "Хлопковый витой шнур макраме",
      "Деревянная основа с росписью личика",
      "Изумрудный фактурный хвост русалки",
      "Огненно-рыжая пряжа для волос",
      "Морские ракушки, морские звезды и жемчужины",
      "Вязаное солнышко",
    ],
    description:
      "Сказочная русалочка с огненно-рыжими локонами и изумрудным макраме-хвостом на качелях внутри морского кольца под лучами летнего солнца.",
    story:
      "Вдохновлена морским бризом и сказками о русалках. Яркая, жизнерадостная куколка принесёт в комнату капельку морской магии, тепла и детского восторга.",
    specs: {
      height_cm: 24,
      materials: [
        "Хлопковый шнур макраме",
        "Дерево с ручной росписью",
        "Изумрудный хвост русалки",
        "Морские ракушки и звезды",
      ],
      collection: "Морские сказки",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-mermaid.jpg",
        alt: "Морское панно Русалочка Ариэль на качелях с ракушками и солнышком",
        displayOrder: 0,
      },
    ],
  },
  {
    slug: "angel-nezhnost",
    title: "Ангел-Хранитель „Нежность“ в пяльцах",
    category: "angels",
    collection: "Ангелы-хранители",
    price: "62.00",
    heightCm: 25,
    materials: [
      "Натуральные бамбуковые пяльцы",
      "Белоснежная хлопковая бахрома макраме",
      "Пудрово-розовый хлопковый шнур",
      "Деревянная точеная бусина",
      "Перламутровое украшение",
    ],
    description:
      "Величественный ангел с роскошными фактурными макраме-крыльями в деревянных пяльцах. Платье пудрово-розового оттенка и длинные белоснежные локоны.",
    story:
      "Ангел спокойствия, чистоты и гармонии. Его пушистые крылья словно укрывают дом от любых невзгод, даря чувство защиты и умиротворения.",
    specs: {
      height_cm: 25,
      materials: [
        "Бамбуковые пяльцы",
        "Хлопковая бахрома макраме",
        "Пудрово-розовый хлопок",
        "Натуральное дерево",
      ],
      collection: "Ангелы-хранители",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-angel-wings.jpg",
        alt: "Ангел-Хранитель Нежность с макраме-крыльями в деревянных пяльцах",
        displayOrder: 0,
      },
    ],
  },
  {
    slug: "bereginya-i-ladushka",
    title: "Обережные куклы „Берегиня и Ладушка“",
    category: "miniatures",
    collection: "Славянские обереги",
    price: "54.00",
    heightCm: 20,
    materials: [
      "Натуральный небеленый белорусский лён",
      "Хлопковая пряжа ручной намотки",
      "Тканый фартук и очелье с традиционным орнаментом",
      "Хлопковое кружево и натуральное дерево",
    ],
    description:
      "Пара традиционных текстильных славянских кукол-мотанок. Одна в натуральном льняном платье, вторая — в аутентичном праздничном строе с вышитым орнаментом.",
    story:
      "С древних времен куклы-мотанки создавались без единого шва иголкой как хранительницы рода, домашнего очага и девичьей красоты. Выполнены строго по традиционным канонам славянского текстильного мастерства.",
    specs: {
      height_cm: 20,
      materials: [
        "Белорусский лён",
        "Хлопковая пряжа",
        "Ткань с традиционным орнаментом",
        "Хлопковое кружево",
      ],
      collection: "Славянские обереги",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-motanka-folk.jpg",
        alt: "Традиционные славянские куклы-мотанки Берегиня и Ладушка в белорусском строе",
        displayOrder: 0,
      },
    ],
  },
  {
    slug: "tsvetochnaya-feya",
    title: "Панно „Цветочная фея на качелях“",
    category: "fairies",
    collection: "Цветочные феи",
    price: "56.00",
    heightCm: 24,
    materials: [
      "Джутовый венок, увитый зеленым плющом",
      "Пышные садовые розы и первоцветы",
      "Воздушный ромашковый фатин",
      "Светлое натуральное дерево",
      "Крошечные крылышки стрекозы",
    ],
    description:
      "Миниатюрная фея в нежном розовом платье и фатине с ромашками беззаботно качается на качелях среди пышного венка из шелковых роз.",
    story:
      "Олицетворение весны, цветущего сада и радостных улыбок. Прекрасный акцент для спальни, детской комнаты или подарка близкому человеку.",
    specs: {
      height_cm: 24,
      materials: [
        "Джутовый венок с плющом",
        "Садовые розы и первоцветы",
        "Ромашковый фатин",
        "Светлое дерево",
      ],
      collection: "Цветочные феи",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-flower-fairy.jpg",
        alt: "Цветочное настенное панно с феей на качелях в венке из роз",
        displayOrder: 0,
      },
    ],
  },
  {
    slug: "zimnyaya-skazka",
    title: "Панно-ловец „Зимняя сказка“",
    category: "seasonal",
    collection: "Времена года",
    price: "59.00",
    heightCm: 25,
    materials: [
      "Белый хлопковый обод",
      "Подвесные гирлянды из мягких снежных помпонов",
      "Хрустальные кристаллы-снежинки",
      "Куколка-Снегурочка в белоснежном платье",
      "Куколка в алом новогоднем колпачке",
    ],
    description:
      "Волшебное снежное панно-ловец: падающие пушистые снежинки, кристаллы льда и две зимние феи ручной работы.",
    story:
      "Композиция, наполненная предвкушением новогоднего чуда, запахом мандаринов и скрипом свежего снега под ногами. Сохраняет сказочное зимнее настроение круглый год.",
    specs: {
      height_cm: 25,
      materials: [
        "Белый хлопок",
        "Снежные помпоны",
        "Кристаллы-снежинки",
        "Светлое дерево",
      ],
      collection: "Времена года",
      year: 2026,
    },
    images: [
      {
        url: "/mock/dolls/doll-winter-fairy.jpg",
        alt: "Зимнее панно-ловец с подвесными помпонами, снежинками и куклами-феями",
        displayOrder: 0,
      },
    ],
  },
];

async function main() {
  console.log("🌸 Синхронизация кукол в наличии (7 реальных работ мастера)...");

  // 1. Снимаем все зависшие брони
  await db.delete(reservations);

  // 2. Все куклы, кроме наших 7 целевых, переводим в статус 'sold' («Нашла дом»)
  const targetSlugs = AVAILABLE_DOLLS.map((d) => d.slug);
  await db
    .update(products)
    .set({ status: "sold" })
    .where(notInArray(products.slug, targetSlugs));

  console.log("📦 Все сторонние куклы переведены в статус 'sold' (Архив).");

  // 3. Создаем или обновляем ровно эти 7 кукол в статусе 'available'
  for (const doll of AVAILABLE_DOLLS) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.slug, doll.slug));

    let productId: string;

    if (existing) {
      productId = existing.id;
      await db
        .update(products)
        .set({
          title: doll.title,
          story: doll.story,
          specs: doll.specs,
          price: doll.price,
          status: "available",
          isFeatured: true,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
      console.log(`✨ Обновлена кукла в наличии: ${doll.title} (${doll.slug})`);
    } else {
      productId = crypto.randomUUID();
      await db.insert(products).values({
        id: productId,
        slug: doll.slug,
        title: doll.title,
        story: doll.story,
        specs: doll.specs,
        price: doll.price,
        currency: "BYN",
        status: "available",
        isFeatured: true,
      });
      console.log(`🎉 Создана новая кукла в наличии: ${doll.title} (${doll.slug})`);
    }

    // Обновляем медиа для куклы
    await db.delete(productMedia).where(eq(productMedia.productId, productId));

    for (const img of doll.images) {
      await db.insert(productMedia).values({
        id: crypto.randomUUID(),
        productId,
        url: img.url,
        mediaType: "image",
        displayOrder: img.displayOrder,
        blurDataUrl: BLUR_PLACEHOLDER,
        width: 732,
        height: 824,
        alt: img.alt,
      });
    }
  }

  // 4. Удаляем временные тестовые куклы без заказов
  try {
    await client`
      DELETE FROM products
      WHERE (slug LIKE 'pay-action-doll-%' OR slug LIKE 'webhook-doll-%' OR slug LIKE 'fairy-demo-%')
        AND id NOT IN (SELECT product_id FROM order_items);
    `;
    console.log("🧹 Тестовые дубликаты без заказов очищены.");
  } catch (err) {
    console.warn("Предупреждение при очистке тестов:", err);
  }

  console.log("✅ Успешно! В каталоге ровно 7 кукол в наличии с реальными авторскими фотографиями.");
  await client.end();
}

main();
