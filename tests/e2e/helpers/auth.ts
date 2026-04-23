import { expect, type Page } from "@playwright/test";

type TestAccount = "buyer" | "seller";

export async function loginAs(page: Page, account: TestAccount = "buyer") {
  await page.goto("/login");
  await page.locator("#email").fill(`${account}@test.com`);
  await page.locator("#password").fill("Test1234!");

  const loginResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/auth/login"), { timeout: 15_000 })
    .catch(() => null);

  await page.locator('form button[type="submit"]').click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse, "Login API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    loginResponse!.ok(),
    `Login API failed. status=${loginResponse!.status()} body=${await loginResponse!.text()}`,
  ).toBeTruthy();

  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  await expect(page.locator("body")).toContainText("iPad Pro 11");
}
