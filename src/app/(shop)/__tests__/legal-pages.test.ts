import { describe, it, expect } from "vitest";
import { metadata as deliveryMeta } from "../dostavka-i-oplata/page";
import { metadata as ofertaMeta } from "../oferta/page";
import { metadata as privacyMeta } from "../politika-konfidencialnosti/page";
import { LegalInfo } from "@/components/layout/LegalInfo";

describe("Informative & Legal Pages (Step 2.9)", () => {
  it("provides valid SEO metadata for /dostavka-i-oplata", () => {
    expect(deliveryMeta.title).toContain("Почта и самовывоз");
    expect(deliveryMeta.title).toContain("DollShop");
    expect(deliveryMeta.description).toContain("почтой");
  });

  it("provides valid SEO metadata for /oferta", () => {
    expect(ofertaMeta.title).toContain("Публичная оферта");
    expect(ofertaMeta.title).toContain("DollShop");
    expect(ofertaMeta.description).toContain("договор");
  });

  it("provides valid SEO metadata for /politika-konfidencialnosti", () => {
    expect(privacyMeta.title).toContain("Политика конфиденциальности");
    expect(privacyMeta.title).toContain("Закон № 99-З");
    expect(privacyMeta.description).toContain("персональных данных");
  });

  it("exports LegalInfo component correctly", () => {
    expect(typeof LegalInfo).toBe("function");
  });
});
