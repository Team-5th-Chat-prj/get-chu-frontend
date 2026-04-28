import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("product creation blocks invalid fields before API request", async ({ page }) => {
  let createProductRequestCount = 0;

  page.on("request", (request) => {
    if (
      request.url().includes("/api/products") &&
      request.method() === "POST" &&
      !request.url().includes("/reserve")
    ) {
      createProductRequestCount += 1;
    }
  });

  await loginAs(page, "buyer");
  await page.goto("/products/new");
  await page.locator("#title").fill("a");
  await page.locator("#price").fill("99");
  await page.locator("#description").fill("");

  const submitButton = page.locator("header button").last();
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(400);

  expect(createProductRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/products\/new$/);
});

test("product edit blocks invalid low price before API request", async ({ page }) => {
  let updateProductRequestCount = 0;

  page.on("request", (request) => {
    if (
      request.url().includes("/api/products/1") &&
      request.method() === "PATCH"
    ) {
      updateProductRequestCount += 1;
    }
  });

  await loginAs(page, "seller");
  await page.goto("/products/1/edit");
  await page.locator("#price").fill("99");

  const submitButton = page.locator("header button").last();
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(400);

  expect(updateProductRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/products\/1\/edit$/);
});

test("product edit blocks excessive price before API request", async ({ page }) => {
  let updateProductRequestCount = 0;

  page.on("request", (request) => {
    if (
      request.url().includes("/api/products/1") &&
      request.method() === "PATCH"
    ) {
      updateProductRequestCount += 1;
    }
  });

  await loginAs(page, "seller");
  await page.goto("/products/1/edit");
  await page.locator("#price").fill("2147483648");

  const submitButton = page.locator("header button").last();
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(400);

  expect(updateProductRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/products\/1\/edit$/);
});
