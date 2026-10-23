import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateSiteSettingsAction } from "../settings";
import { siteSettingsSchema } from "@/lib/schemas/site-settings";
import { client } from "@/db/client";
import * as guardModule from "@/lib/auth/guard";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Admin Settings Action (Step 5.7)", () => {
  beforeEach(() => {
    vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
      user: {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Мастер",
        email: "master@dollshop.by",
        role: "admin",
      },
      session: {
        id: "sess-1",
        expiresAt: new Date(Date.now() + 3600000),
        token: "tok-1",
        userId: "a0000000-0000-0000-0000-000000000001",
      },
    });
  });

  afterEach(async () => {
    await client`
      UPDATE site_settings
      SET legal_seller_name = 'ИП Прокопенко А. В.',
          contact_email = 'master@dollshop.by',
          legal_unp = '193758204',
          legal_trade_registry_num = '584920',
          legal_address = 'г. Минск, ул. Немига, 5',
          contact_phone = '+375 (29) 123-45-67',
          delivery_cost_branch = 3.50,
          free_delivery_threshold = 120.00,
          allowed_payment_methods = '["erip_invoice", "bank_transfer", "cod"]'::jsonb
      WHERE id = 1
    `;
  });

  it("siteSettingsSchema валидирует корректные данные", () => {
    const valid = {
      legalSellerName: "ИП Прокопенко А. В.",
      legalUnp: "193758204",
      legalTradeRegistryNum: "584920",
      legalAddress: "г. Минск, ул. Немига, 5",
      contactPhone: "+375 (29) 123-45-67",
      contactEmail: "master@dollshop.by",
      deliveryCostBranch: 4.5,
      freeDeliveryThreshold: 150,
      allowedPaymentMethods: ["cod", "erip_invoice"],
    };

    const res = siteSettingsSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("siteSettingsSchema отклоняет некорректный email", () => {
    const invalid = {
      legalSellerName: "ИП Прокопенко",
      legalUnp: "193758204",
      legalTradeRegistryNum: "584920",
      legalAddress: "г. Минск",
      contactPhone: "+375291234567",
      contactEmail: "not-an-email",
      deliveryCostBranch: 4.5,
      freeDeliveryThreshold: 150,
      allowedPaymentMethods: ["cod"],
    };

    const res = siteSettingsSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("updateSiteSettingsAction обновляет настройки магазина в БД", async () => {
    const res = await updateSiteSettingsAction({
      legalSellerName: "ИП Тестовый Продавец",
      legalUnp: "193758204",
      legalTradeRegistryNum: "584920",
      legalAddress: "г. Минск, пр. Победителей, 1",
      contactPhone: "+375299998877",
      contactEmail: "test-admin@dollshop.by",
      deliveryCostBranch: 5.0,
      freeDeliveryThreshold: 130,
      allowedPaymentMethods: ["cod", "erip_invoice", "bank_transfer"],
    });

    expect(res.success).toBe(true);

    const [row] = await client<Array<{ legal_seller_name: string; contact_email: string }>>`
      SELECT legal_seller_name, contact_email FROM site_settings WHERE id = 1
    `;
    expect(row?.legal_seller_name).toBe("ИП Тестовый Продавец");
    expect(row?.contact_email).toBe("test-admin@dollshop.by");
  });
});
