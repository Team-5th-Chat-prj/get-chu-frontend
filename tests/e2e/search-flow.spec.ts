import { expect, test } from "@playwright/test";

test("search page can find seed product by keyword", async ({ page }) => {
  await page.goto("/search");

  const searchResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/products") && response.url().includes("keyword=iPad"),
  );

  await page.locator("input").first().fill("iPad");
  await page.locator("input").first().press("Enter");

  const searchResponse = await searchResponsePromise;
  expect(
    searchResponse.ok(),
    `Search API failed. status=${searchResponse.status()} body=${await searchResponse.text()}`,
  ).toBeTruthy();

  await expect(page.locator("article").filter({ hasText: "iPad Pro 11" })).toBeVisible();
});

test("search page shows no product cards for an unknown keyword", async ({ page }) => {
  await page.goto("/search");

  const keyword = "no-such-getchu-product";
  const searchResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/products") && response.url().includes(`keyword=${keyword}`),
  );

  await page.locator("input").first().fill(keyword);
  await page.locator("input").first().press("Enter");

  const searchResponse = await searchResponsePromise;
  expect(
    searchResponse.ok(),
    `Search API failed. status=${searchResponse.status()} body=${await searchResponse.text()}`,
  ).toBeTruthy();

  await expect(page.locator("article")).toHaveCount(0);
});
