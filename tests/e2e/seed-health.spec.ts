import { expect, test } from "@playwright/test";

test("home feed shows safe seed products", async ({ page }) => {
  const productsResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/products?size=50"), { timeout: 15_000 })
    .catch(() => null);

  await page.goto("/");

  const productsResponse = await productsResponsePromise;
  expect(productsResponse, "Products API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    productsResponse!.ok(),
    `Products API failed. status=${productsResponse!.status()} body=${await productsResponse!.text()}`,
  ).toBeTruthy();

  await expect(page.getByText("iPad Pro 11")).toBeVisible();
  await expect(page.getByText("MacBook Pro 14 M3")).toBeVisible();
});
