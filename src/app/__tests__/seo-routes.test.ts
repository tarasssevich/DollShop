import { describe, it, expect } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";

describe("SEO Routes (robots.txt & sitemap.xml)", () => {
  it("robots() возвращает корректные правила для поисковых ботов и Яндекса", () => {
    const robotsConfig = robots();

    expect(robotsConfig.sitemap).toContain("/sitemap.xml");
    expect(robotsConfig.host).toBeTruthy();

    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules
      : [robotsConfig.rules];

    // Проверка общего правила для всех ботов (*)
    const wildcardRule = rules.find((r) => r.userAgent === "*");
    expect(wildcardRule).toBeDefined();
    expect(wildcardRule?.allow).toBe("/");
    expect(wildcardRule?.disallow).toContain("/admin");
    expect(wildcardRule?.disallow).toContain("/cart");
    expect(wildcardRule?.disallow).toContain("/oformlenie");
    expect(wildcardRule?.disallow).toContain("/oplata");
    expect(wildcardRule?.disallow).toContain("/api");

    // Проверка специфичных директив для Яндекса
    const yandexRule = rules.find((r) => r.userAgent === "Yandex");
    expect(yandexRule).toBeDefined();
    expect(yandexRule?.other?.["Clean-param"]).toBeDefined();
  });

  it("sitemap() возвращает статические разделы и динамические карточки кукол", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dollshop.by";
    const entries = await sitemap();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(8);

    const urls = entries.map((e) => e.url);

    // Проверка обязательных статических страниц
    expect(urls.some((u) => u === baseUrl || u === `${baseUrl}/`)).toBe(true);
    expect(urls.some((u) => u.endsWith("/kukly"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/na-zakaz"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/galereya"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/o-mastere"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/dostavka-i-oplata"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/oferta"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/politika-konfidencialnosti"))).toBe(true);

    // Проверка динамических страниц кукол
    const dollEntries = entries.filter((e) => e.url.includes("/kukly/"));
    expect(dollEntries.length).toBeGreaterThan(0);

    for (const entry of dollEntries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0.7);
      expect(entry.changeFrequency).toBeDefined();
      expect(entry.lastModified).toBeDefined();
    }
  });
});
