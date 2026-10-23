"use server";

import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { customRequests, products, productMedia } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";

export interface AdminCustomRequestItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerContact: string | null;
  contactChannel: "telegram" | "viber" | "call";
  wishes: string | null;
  status: "new" | "in_discussion" | "accepted" | "declined";
  createdAt: string;
  referenceDoll: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
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

    const result: AdminCustomRequestItem[] = [];

    for (const req of rawRequests) {
      let referenceDoll: AdminCustomRequestItem["referenceDoll"] = null;

      if (req.referenceProductId) {
        const [prod] = await db
          .select({
            id: products.id,
            title: products.title,
            slug: products.slug,
          })
          .from(products)
          .where(eq(products.id, req.referenceProductId));

        if (prod) {
          const [media] = await db
            .select({ url: productMedia.url })
            .from(productMedia)
            .where(eq(productMedia.productId, prod.id))
            .orderBy(productMedia.displayOrder)
            .limit(1);

          referenceDoll = {
            id: prod.id,
            title: prod.title,
            slug: prod.slug,
            coverUrl: media?.url ?? null,
          };
        }
      }

      result.push({
        id: req.id,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        customerContact: req.customerContact,
        contactChannel: req.contactChannel as "telegram" | "viber" | "call",
        wishes: req.wishes,
        status: req.status as "new" | "in_discussion" | "accepted" | "declined",
        createdAt: req.createdAt.toISOString(),
        referenceDoll,
      });
    }

    return { success: true, requests: result };
  } catch (err) {
    console.error("Ошибка при получении заявок:", err);
    return { success: false, requests: [], error: "Не удалось загрузить заявки" };
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

    return { success: true };
  } catch (err) {
    console.error("Ошибка обновления статуса заявки:", err);
    return { success: false, error: "Не удалось сохранить статус" };
  }
}
