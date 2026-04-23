import { expect, test } from "@playwright/test";

test("login rejects wrong password and stays on login page", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill("buyer@test.com");
  await page.locator("#password").fill("Wrong1234!");

  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/login"),
  );

  await page.locator('form button[type="submit"]').click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(401);
  await expect(page).toHaveURL(/\/login$/);
});
