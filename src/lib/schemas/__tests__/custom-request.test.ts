import { describe, it, expect } from "vitest";
import { customRequestSchema } from "../custom-request";

describe("CustomRequestSchema (Step 2.8)", () => {
  it("validates valid custom request and normalizes Belarus phone", () => {
    const valid = {
      name: "Екатерина",
      phone: "+375 (29) 123-45-67",
      preferredChannel: "telegram",
      wishes: "Мятное платье и букетик незабудок",
      fromDollSlug: "selesta",
      fromDollName: "Селеста",
      pdConsent: true,
      honeypot: "",
    };

    const result = customRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Екатерина");
      expect(result.data.phone).toBe("+375291234567");
      expect(result.data.preferredChannel).toBe("telegram");
    }
  });

  it("normalizes Belarus local 8029 phone format", () => {
    const data = {
      name: "Ольга",
      phone: "8029 987-65-43",
      pdConsent: true,
    };

    const result = customRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+375299876543");
    }
  });

  it("fails if pdConsent is false (consent to personal data is mandatory by law)", () => {
    const data = {
      name: "Ольга",
      phone: "+375 (29) 111-22-33",
      pdConsent: false,
    };

    const result = customRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "pdConsent");
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("согласие на обработку персональных данных");
    }
  });

  it("fails if name is too short (< 2 characters)", () => {
    const data = {
      name: "А",
      phone: "+375 (29) 111-22-33",
      pdConsent: true,
    };

    const result = customRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("fails if phone is invalid", () => {
    const data = {
      name: "Марина",
      phone: "12345",
      pdConsent: true,
    };

    const result = customRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects bots if honeypot is filled", () => {
    const botData = {
      name: "Bot Spam",
      phone: "+375 (29) 111-22-33",
      pdConsent: true,
      honeypot: "http://spam-link.com",
    };

    const result = customRequestSchema.safeParse(botData);
    expect(result.success).toBe(false);
  });

  it("defaults preferredChannel to 'telegram'", () => {
    const data = {
      name: "Алена",
      phone: "+375 (29) 555-44-33",
      pdConsent: true,
    };

    const result = customRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredChannel).toBe("telegram");
    }
  });
});
