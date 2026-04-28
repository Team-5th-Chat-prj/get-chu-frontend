import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("unauthenticated user is redirected to login from product creation page", async ({ page }) => {
  await page.goto("/products/new");

  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});

test("buyer cannot update seller product from direct edit page", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1/edit");

  await expect(page).toHaveURL(/\/products\/1\/edit$/, { timeout: 15_000 });
  await page.locator("#title").fill("Unauthorized edit attempt");

  const updateResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/products/1") && response.request().method() === "PATCH",
  );

  await page.locator("header button").last().click();

  const updateResponse = await updateResponsePromise;
  expect(updateResponse.status()).toBe(403);
  await expect(page).toHaveURL(/\/products\/1\/edit$/);
});
