"use server";

import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdminAction } from "@/lib/auth/guard";
import { CACHE_TAGS } from "@/lib/cache/tags";

export const siteSettingsSchema = z.object({
  legalSellerName: z.string().min(2, "Укажите имя продавца / ИП"),
  legalUnp: z.string().min(9, "УНП должен содержать 9 цифр"),
  legalTradeRegistryNum: z.string().min(1, "Укажите номер в Торговом реестре"),
  legalAddress: z.string().min(3, "Укажите юридический адрес"),
  contactPhone: z.string().min(7, "Укажите контактный телефон"),
  contactEmail: z.string().email("Некорректный email"),
  deliveryCostBranch: z.number().min(0, "Стоимость не может быть отрицательной"),
  freeDeliveryThreshold: z.number().min(0, "Порог не может быть отрицательным"),
  allowedPaymentMethods: z.array(z.string()).min(1, "Выберите хотя бы один способ оплаты"),
});

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

    revalidateTag(CACHE_TAGS.settings, "max-age=0");
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
