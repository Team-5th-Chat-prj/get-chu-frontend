import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("buyer can open my page and see own selling list", async ({ page }) => {
  await loginAs(page, "buyer");

  await page.goto("/my");
  await expect(page.locator("body")).toContainText("buyer");

  await page.goto("/my/products");
  await expect(page.getByText("MacBook Pro 14 M3")).toBeVisible();
});

test("seller can open my selling list with seller seed products", async ({ page }) => {
  await loginAs(page, "seller");

  await page.goto("/my/products");
  await expect(page.getByText("iPad Pro 11")).toBeVisible();
});

test("buyer can open my purchases page without crashing", async ({ page }) => {
  await loginAs(page, "buyer");

  const tradesResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/members/me/trades"), { timeout: 15_000 })
    .catch(() => null);

  await page.goto("/my/purchases");

  const tradesResponse = await tradesResponsePromise;
  expect(tradesResponse, "Trades API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    tradesResponse!.ok(),
    `Trades API failed. status=${tradesResponse!.status()} body=${await tradesResponse!.text()}`,
  ).toBeTruthy();
});
