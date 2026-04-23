import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

function likeButton(page: Page) {
  return page.getByTestId("product-like-button");
}

async function readLikeCount(page: Page) {
  const value = await likeButton(page).locator("span").last().innerText();
  return Number(value.replace(/[^\d]/g, ""));
}

async function ensureProductIsUnliked(page: Page) {
  if ((await likeButton(page).getAttribute("data-liked")) === "true") {
    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute("data-liked", "false");
    await page.reload();
    await expect(likeButton(page)).toHaveAttribute("data-liked", "false");
  }
}

test("buyer can like seller product and keep it after refresh", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();

  await ensureProductIsUnliked(page);
  const beforeCount = await readLikeCount(page);

  await likeButton(page).click();
  await expect(likeButton(page)).toHaveAttribute("data-liked", "true");

  const expectedCount = beforeCount + 1;
  await expect.poll(() => readLikeCount(page)).toBe(expectedCount);

  await page.reload();
  await expect(likeButton(page)).toHaveAttribute("data-liked", "true");
  await expect.poll(() => readLikeCount(page)).toBe(expectedCount);
});

test("buyer can unlike seller product and keep it unliked after refresh", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();

  if ((await likeButton(page).getAttribute("data-liked")) === "false") {
    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute("data-liked", "true");
  }

  const beforeUnlikeCount = await readLikeCount(page);

  await likeButton(page).click();
  await expect(likeButton(page)).toHaveAttribute("data-liked", "false");
  await expect.poll(() => readLikeCount(page)).toBe(Math.max(0, beforeUnlikeCount - 1));

  await page.reload();
  await expect(likeButton(page)).toHaveAttribute("data-liked", "false");
});

test("buyer can see liked seller product in my likes page", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();

  if ((await likeButton(page).getAttribute("data-liked")) === "false") {
    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute("data-liked", "true");
  }

  await page.goto("/my/likes");
  await expect(page.getByText("iPad Pro 11")).toBeVisible();
});

test("seller cannot like own product from detail page", async ({ page }) => {
  await loginAs(page, "seller");
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();

  await expect(likeButton(page)).toHaveCount(0);
  await expect(page.locator("body")).toContainText("iPad Pro 11");
});
