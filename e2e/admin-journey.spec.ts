import { test, expect } from "@playwright/test";

test.describe("Master Admin Journey E2E Test Suite (Step 7.8)", () => {
  test("1. Неавторизованный пользователь перенаправляется на /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);

    await expect(page.locator("text=Вход в мастерскую").first()).toBeVisible();
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
  });

  test("2. Страница настроек магазина защищена", async ({ page }) => {
    await page.goto("/admin/nastrojki");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("3. Тест-центр для мобильных устройств доступен по /demo", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("text=Центр тестирования").first()).toBeVisible();
  });
});
