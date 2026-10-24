"use server";

import { z } from "zod";
import { eq, desc, inArray, asc } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { customRequests, products, productMedia, type ProductSpecs } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { mapDbProductToDoll } from "@/lib/data/drizzle/mappers";
import { CACHE_TAGS } from "@/lib/cache/tags";
import type { Doll } from "@/types/domain";

export interface AdminCustomRequestItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerContact: string | null;
  contactChannel: "telegram" | "viber" | "call";
  wishes: string | null;
  referencePhotoUrls: string[];
  status: "new" | "in_discussion" | "accepted" | "declined";
  createdAt: string;
  publicToken?: string;
  referenceDoll: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  } | null;
  responseDoll: {
    id: string;
    title: string;
    slug: string;
    priceByn: number;
    heightCm: number;
    story: string;
    materials: string[];
    collection?: string;
    coverUrl: string | null;
    status: string;
    isCustomOrder: boolean;
  } | null;
}

/**
 * Получение всех входящих индивидуальных заявок для админ-панели (Step 5.6).
 */
export async function getAdminRequestsAction(): Promise<{
  success: boolean;
  requests: AdminCustomRequestItem[];
  error?: string;
}> {
  await requireAdminAction();

  try {
    const rawRequests = await db
      .select()
      .from(customRequests)
      .orderBy(desc(customRequests.createdAt));

    if (rawRequests.length === 0) {
      return { success: true, requests: [] };
    }

    // Собираем все уникальные id кукол-ориентиров и кукол-ответов для O(1) batch-выборки
    const productIdsSet = new Set<string>();
    for (const r of rawRequests) {
      if (r.referenceProductId) productIdsSet.add(r.referenceProductId);
      if (r.responseProductId) productIdsSet.add(r.responseProductId);
    }
    const allUniqueProductIds = Array.from(productIdsSet);

    type ProductMapItem = {
      id: string;
      title: string;
      slug: string;
      price: string;
      specs: ProductSpecs;
      story: string;
      status: string;
      isCustomOrder: boolean;
    };

    const productsById = new Map<string, ProductMapItem>();
    const coversByProductId = new Map<string, string>();

    if (allUniqueProductIds.length > 0) {
      const allProducts = await db
        .select({
          id: products.id,
          title: products.title,
          slug: products.slug,
          price: products.price,
          specs: products.specs,
          story: products.story,
          status: products.status,
          isCustomOrder: products.isCustomOrder,
        })
        .from(products)
        .where(inArray(products.id, allUniqueProductIds));

      for (const p of allProducts) {
        productsById.set(p.id, p);
      }

      const allMedia = await db
        .select({
          productId: productMedia.productId,
          url: productMedia.url,
        })
        .from(productMedia)
        .where(inArray(productMedia.productId, allUniqueProductIds))
        .orderBy(asc(productMedia.displayOrder));

      for (const m of allMedia) {
        if (!coversByProductId.has(m.productId)) {
          coversByProductId.set(m.productId, m.url);
        }
      }
    }

    const result: AdminCustomRequestItem[] = rawRequests.map((req) => {
      let referenceDoll: AdminCustomRequestItem["referenceDoll"] = null;
      let responseDoll: AdminCustomRequestItem["responseDoll"] = null;

      if (req.referenceProductId) {
        const prod = productsById.get(req.referenceProductId);
        if (prod) {
          referenceDoll = {
            id: prod.id,
            title: prod.title,
            slug: prod.slug,
            coverUrl: coversByProductId.get(prod.id) ?? null,
          };
        }
      }

      if (req.responseProductId) {
        const respProd = productsById.get(req.responseProductId);
        if (respProd) {
          responseDoll = {
            id: respProd.id,
            title: respProd.title,
            slug: respProd.slug,
            priceByn: parseFloat(respProd.price),
            heightCm: respProd.specs.height_cm || 20,
            story: respProd.story,
            materials: respProd.specs.materials || [],
            collection: respProd.specs.collection,
            coverUrl: coversByProductId.get(respProd.id) ?? null,
            status: respProd.status,
            isCustomOrder: respProd.isCustomOrder,
          };
        }
      }

      return {
        id: req.id,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        customerContact: req.customerContact,
        contactChannel: req.contactChannel as "telegram" | "viber" | "call",
        wishes: req.wishes,
        referencePhotoUrls: req.referencePhotoUrls ?? [],
        status: req.status as "new" | "in_discussion" | "accepted" | "declined",
        createdAt: req.createdAt.toISOString(),
        publicToken: req.publicToken,
        referenceDoll,
        responseDoll,
      };
    });

    return { success: true, requests: result };
  } catch (err) {
    console.error("Ошибка при получении заявок:", err);
    return { success: false, requests: [], error: "Не удалось загрузить заявки" };
  }
}

/**
 * Получение полной модели куклы по ID для редактирования в модальном окне админки.
 */
export async function getAdminDollByIdAction(
  id: string
): Promise<{ success: boolean; doll?: Doll | null; error?: string }> {
  await requireAdminAction();

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return { success: false, error: "Кукла не найдена" };
    }

    const media = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, id))
      .orderBy(asc(productMedia.displayOrder));

    const doll = mapDbProductToDoll(product, media);
    return { success: true, doll };
  } catch (err) {
    console.error("Ошибка загрузки куклы по ID:", err);
    return { success: false, error: "Не удалось загрузить данные куклы" };
  }
}

const updateRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["new", "in_discussion", "accepted", "declined"]),
});

/**
 * Обновление статуса индивидуальной заявки мастером.
 */
export async function updateAdminRequestStatusAction(
  input: z.infer<typeof updateRequestStatusSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = updateRequestStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры запроса" };
  }

  const { requestId, status } = parsed.data;

  try {
    await db
      .update(customRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(customRequests.id, requestId));

    try {
      revalidatePath("/admin/zayavki", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка обновления статуса заявки:", err);
    return { success: false, error: "Не удалось сохранить статус" };
  }
}

const updateRequestPhotosSchema = z.object({
  requestId: z.string().uuid(),
  photoUrls: z.array(z.string().min(1)),
});

/**
 * Добавление/обновление списка фото-референсов к заявке мастером.
 */
export async function updateAdminRequestPhotosAction(
  input: z.infer<typeof updateRequestPhotosSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = updateRequestPhotosSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры" };
  }

  const { requestId, photoUrls } = parsed.data;

  try {
    await db
      .update(customRequests)
      .set({ referencePhotoUrls: photoUrls, updatedAt: new Date() })
      .where(eq(customRequests.id, requestId));

    try {
      revalidatePath("/admin/zayavki", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка обновления фото заявки:", err);
    return { success: false, error: "Не удалось сохранить фото-референсы" };
  }
}

export interface AvailableDollOption {
  id: string;
  title: string;
  slug: string;
  priceByn: number;
  coverUrl: string | null;
  status: string;
  collection?: string;
}

/**
 * Получение списка кукол, доступных для прикрепления к индивидуальной заявке.
 */
export async function getAvailableDollsForRequestAction(): Promise<{
  success: boolean;
  dolls: AvailableDollOption[];
  error?: string;
}> {
  await requireAdminAction();

  try {
    const rawProducts = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        price: products.price,
        status: products.status,
        specs: products.specs,
      })
      .from(products)
      .where(inArray(products.status, ["available", "draft", "made_to_order"]))
      .orderBy(desc(products.createdAt));

    if (rawProducts.length === 0) {
      return { success: true, dolls: [] };
    }

    const prodIds = rawProducts.map((p) => p.id);
    const media = await db
      .select({
        productId: productMedia.productId,
        url: productMedia.url,
      })
      .from(productMedia)
      .where(inArray(productMedia.productId, prodIds))
      .orderBy(asc(productMedia.displayOrder));

    const coverMap = new Map<string, string>();
    for (const m of media) {
      if (!coverMap.has(m.productId)) {
        coverMap.set(m.productId, m.url);
      }
    }

    const dolls: AvailableDollOption[] = rawProducts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      priceByn: parseFloat(p.price),
      coverUrl: coverMap.get(p.id) ?? null,
      status: p.status,
      collection: p.specs.collection,
    }));

    return { success: true, dolls };
  } catch (err) {
    console.error("Ошибка загрузки доступных кукол:", err);
    return { success: false, dolls: [], error: "Не удалось загрузить каталог кукол" };
  }
}

const attachExistingDollSchema = z.object({
  requestId: z.string().uuid(),
  productId: z.string().uuid(),
});

/**
 * Прикрепление существующей куклы из каталога к индивидуальной заявке в 1 клик.
 */
export async function attachExistingDollToRequestAction(
  input: z.infer<typeof attachExistingDollSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = attachExistingDollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры запроса" };
  }

  const { requestId, productId } = parsed.data;

  try {
    const [request] = await db
      .select()
      .from(customRequests)
      .where(eq(customRequests.id, requestId));

    if (!request) {
      return { success: false, error: "Заявка не найдена" };
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return { success: false, error: "Выбранная кукла не найдена" };
    }

    // Привязываем куклу к заявке и обновляем статус заявки при необходимости
    await db
      .update(customRequests)
      .set({
        responseProductId: productId,
        status: request.status === "new" ? "accepted" : request.status,
        updatedAt: new Date(),
      })
      .where(eq(customRequests.id, requestId));

    await db
      .update(products)
      .set({
        customRequestId: requestId,
        isCustomOrder: true,
        status: product.status === "available" ? "reserved" : product.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(product.slug), { expire: 0 });
      revalidatePath("/admin/zayavki", "page");
      revalidatePath("/admin/kukly", "page");
      revalidatePath("/kukly", "page");
      revalidatePath("/", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка прикрепления куклы к заявке:", err);
    return { success: false, error: "Не удалось прикрепить куклу к заявке" };
  }
}

const markResponseDollSoldSchema = z.object({
  requestId: z.string().uuid(),
  productId: z.string().uuid(),
});

/**
 * Быстрая отметка куклы-ответа как оплаченной/выполненной мастером.
 */
export async function markResponseDollSoldAction(
  input: z.infer<typeof markResponseDollSoldSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAction();

  const parsed = markResponseDollSoldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Некорректные параметры" };
  }

  const { requestId, productId } = parsed.data;

  try {
    const [product] = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return { success: false, error: "Кукла не найдена" };
    }

    await db
      .update(products)
      .set({
        status: "sold",
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    await db
      .update(customRequests)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(customRequests.id, requestId));

    try {
      revalidateTag(CACHE_TAGS.products, { expire: 0 });
      revalidateTag(CACHE_TAGS.product(product.slug), { expire: 0 });
      revalidatePath("/admin/zayavki", "page");
      revalidatePath("/admin/kukly", "page");
      revalidatePath("/kukly", "page");
      revalidatePath("/galereya", "page");
      revalidatePath("/", "page");
    } catch {
      // Игнорируем вне Next.js
    }

    return { success: true };
  } catch (err) {
    console.error("Ошибка закрытия заявки как проданной:", err);
    return { success: false, error: "Не удалось перевести статус в 'Продано'" };
  }
}

