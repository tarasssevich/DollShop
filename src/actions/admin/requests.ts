"use server";

import { z } from "zod";
import { eq, desc, inArray, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { customRequests, products, productMedia, type ProductSpecs } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { mapDbProductToDoll } from "@/lib/data/drizzle/mappers";
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
