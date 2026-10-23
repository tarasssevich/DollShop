"use server";

import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { siteSettingsSchema } from "@/lib/schemas/site-settings";


export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export async function updateSiteSettingsAction(input: SiteSettingsInput): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAdminAction();

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Некорректные данные настроек",
    };
  }

  const data = parsed.data;

  try {
    // Upsert singleton settings (id = 1)
    await db
      .insert(siteSettings)
      .values({
        id: 1,
        legalSellerName: data.legalSellerName,
        legalUnp: data.legalUnp,
        legalTradeRegistryNum: data.legalTradeRegistryNum,
        legalAddress: data.legalAddress,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        deliveryCostBranch: data.deliveryCostBranch.toFixed(2),
        freeDeliveryThreshold: data.freeDeliveryThreshold.toFixed(2),
        allowedPaymentMethods: data.allowedPaymentMethods,
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          legalSellerName: data.legalSellerName,
          legalUnp: data.legalUnp,
          legalTradeRegistryNum: data.legalTradeRegistryNum,
          legalAddress: data.legalAddress,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          deliveryCostBranch: data.deliveryCostBranch.toFixed(2),
          freeDeliveryThreshold: data.freeDeliveryThreshold.toFixed(2),
          allowedPaymentMethods: data.allowedPaymentMethods,
        },
      });

    revalidateTag(CACHE_TAGS.settings, { expire: 0 });
    revalidatePath("/");
    revalidatePath("/admin/nastrojki");
    revalidatePath("/dostavka-i-oplata");
    revalidatePath("/oferta");

    return { success: true };
  } catch (err) {
    console.error("Ошибка сохранения настроек:", err);
    return { success: false, error: "Не удалось сохранить настройки" };
  }
}
