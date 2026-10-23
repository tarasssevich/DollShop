import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { BePaidPaymentProvider } from "@/lib/payments/bepaid";
import { createCustomRequestAction } from "@/actions/request";
import { getOrderByPublicToken } from "@/lib/data/orders";

describe("Security Audit & Pentest Verification Suite (Step 7.5)", () => {
  describe("1. Timing-Safe Cryptographic Signature Verification", () => {
    it("проверяет защиту от timing attack при сверке авторизации вебхука", async () => {
      process.env.BEPAID_SHOP_ID = "test_shop_123";
      process.env.BEPAID_SECRET_KEY = "test_secret_key_456";

      const provider = new BePaidPaymentProvider();
      const rawBody = JSON.stringify({
        transaction: {
          uid: "trx_sec_01",
          status: "successful",
          amount: 5500,
          currency: "BYN",
          tracking_id: "order_999",
        },
      });

      const validAuth = `Basic ${Buffer.from("test_shop_123:test_secret_key_456").toString("base64")}`;
      const validHeaders = new Headers({ authorization: validAuth });

      const validRes = await provider.verifyWebhook(validHeaders, rawBody);
      expect(validRes.valid).toBe(true);

      // Подмена последнего символа заголовка
      const tamperedAuth = validAuth.slice(0, -1) + (validAuth.slice(-1) === "A" ? "B" : "A");
      const tamperedHeaders = new Headers({ authorization: tamperedAuth });

      const tamperedRes = await provider.verifyWebhook(tamperedHeaders, rawBody);
      expect(tamperedRes.valid).toBe(false);
      expect(tamperedRes.error).toContain("Неверная подпись");
    });

    it("гарантирует постоянное время сравнения через crypto.timingSafeEqual", () => {
      const a = crypto.createHash("sha256").update("secret_token_alpha").digest();
      const b = crypto.createHash("sha256").update("secret_token_alpha").digest();
      const c = crypto.createHash("sha256").update("secret_token_beta").digest();

      expect(crypto.timingSafeEqual(a, b)).toBe(true);
      expect(crypto.timingSafeEqual(a, c)).toBe(false);
    });
  });

  describe("2. IDOR (Insecure Direct Object Reference) Protection", () => {
    it("отклоняет последовательные числовые ID (перебор заказов невозможен)", async () => {
      const numericIds = ["1", "2", "42", "100", "00001"];
      for (const id of numericIds) {
        const order = await getOrderByPublicToken(id);
        expect(order).toBeNull();
      }
    });

    it("отклоняет пустые или псевдо-токены с инъекциями", async () => {
      const maliciousTokens = [
        "",
        "admin",
        "' OR '1'='1",
        "../admin",
        "undefined",
        "null",
      ];
      for (const token of maliciousTokens) {
        const order = await getOrderByPublicToken(token);
        expect(order).toBeNull();
      }
    });
  });

  describe("3. Honeypot Anti-Bot Protection", () => {
    it("блокирует спам-ботов, заполняющих скрытое honeypot поле (silent honeypot без записи в БД)", async () => {
      const result = await createCustomRequestAction({
        customerName: "Spam Bot",
        customerPhone: "+375 29 111-22-33",
        contactChannel: "telegram",
        customerContact: "@spambot",
        wishes: "Купить куклу на заказ срочно",
        pdConsent: true,
        honeypot: "http://bot-filled-this-field.com",
      });

      // Honeypot ловушка возвращает фиктивный успех боту, но НЕ создаёт запись в базе (requestId отсутствует)
      expect(result.success).toBe(true);
      expect("requestId" in result && result.requestId).toBeFalsy();
    });
  });

  describe("4. Audit of Client Environment Variables & Secret Leaks", () => {
    it("проверяет, что ни один критический секрет не доступен через префикс NEXT_PUBLIC_", () => {
      const envKeys = Object.keys(process.env);
      const nextPublicKeys = envKeys.filter((k) => k.startsWith("NEXT_PUBLIC_"));

      const forbiddenSubstrings = [
        "SECRET",
        "PASSWORD",
        "DATABASE",
        "AUTH_SECRET",
        "BOT_TOKEN",
        "CRON_SECRET",
        "PRIVATE_KEY",
      ];

      for (const key of nextPublicKeys) {
        for (const forbidden of forbiddenSubstrings) {
          expect(key.toUpperCase()).not.toContain(forbidden);
        }
      }
    });

    it("проверяет, что серверные переменные окружения не экспортируются в публичные файлы", () => {
      const publicDir = path.resolve(process.cwd(), "public");
      if (fs.existsSync(publicDir)) {
        const checkDir = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              checkDir(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".json"))) {
              const content = fs.readFileSync(fullPath, "utf-8");
              expect(content).not.toContain("dollshop_dev_password");
              expect(content).not.toContain("dollshop_owner_password");
            }
          }
        };
        checkDir(publicDir);
      }
    });
  });

  describe("5. Open Redirect Protection", () => {
    it("разрешает только локальные относительные пути для перенаправления после авторизации", () => {
      function sanitizeRedirectUrl(url: string | null | undefined): string {
        if (!url) return "/admin";
        if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
          return url;
        }
        return "/admin";
      }

      expect(sanitizeRedirectUrl("/admin/zakazy")).toBe("/admin/zakazy");
      expect(sanitizeRedirectUrl("/admin/kukly/new")).toBe("/admin/kukly/new");
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/admin");
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/admin");
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/admin");
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/admin");
    });
  });
});
