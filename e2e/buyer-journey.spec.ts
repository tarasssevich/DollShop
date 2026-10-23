import { test, expect } from "@playwright/test";

test.describe("Buyer Journey E2E Test Suite (Step 7.8)", () => {
  test("1. Покупатель открывает витрину и просматривает каталог", async ({ page }) => {
    await page.goto("/");

    // Проверяем наличие логотипа и ключевых секций
    await expect(page.locator("text=DollShop").first()).toBeVisible();
    await expect(page.locator("text=Каталог").first()).toBeVisible();

    // Переходим в каталог
    await page.click("text=Каталог");
    await expect(page).toHaveURL(/\/kukly/);

    // Проверяем наличие карточек кукол
    const dollCards = page.locator("article, div[data-testid='doll-card'], a[href*='/kukly/']");
    await expect(dollCards.first()).toBeVisible();
  });

  test("2. Покупатель открывает карточку куклы и проверяет реквизиты", async ({ page }) => {
    await page.goto("/kukly");

    // Кликаем по первой кукле
    const firstDollLink = page.locator("a[href^='/kukly/']").first();
    await firstDollLink.click();

    // Проверяем валюту BYN и наличие описания
    await expect(page.locator("text=BYN").first()).toBeVisible();

    // Проверяем юридический блок в подвале (УНП и Торговый реестр)
    await expect(page.locator("text=УНП").first()).toBeVisible();
    await expect(page.locator("text=Торговый реестр").first()).toBeVisible();
  });

  test("3. Покупатель переходит на страницу условий доставки и оплаты", async ({ page }) => {
    await page.goto("/dostavka-i-oplata");

    // Проверяем ключевые блоки
    await expect(page.locator("text=Почта, самовывоз и оплата").first()).toBeVisible();
    await expect(page.locator("text=По всей Беларуси").first()).toBeVisible();
    await expect(page.locator("text=Самовывоз в Минске").first()).toBeVisible();
    await expect(page.locator("text=ЕРИП").first()).toBeVisible();
  });

  test("4. Покупатель знакомится с публичной офертой и политикой данных", async ({ page }) => {
    await page.goto("/oferta");
    await expect(page.locator("text=Публичная оферта").first()).toBeVisible();
    await expect(page.locator("text=Гражданского кодекса Республики Беларусь").first()).toBeVisible();

    await page.goto("/politika-konfidencialnosti");
    await expect(page.locator("text=Политика в отношении обработки персональных данных").first()).toBeVisible();
    await expect(page.locator("text=Законом Республики Беларусь от 7 мая 2021 г. № 99-З").first()).toBeVisible();
  });
});
