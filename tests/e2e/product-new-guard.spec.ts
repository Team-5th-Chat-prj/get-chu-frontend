import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("verified buyer can open product creation page", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.evaluate(() => localStorage.removeItem("getchu.verifiedLocation"));

  await page.goto("/products/new");

  await expect(page).toHaveURL(/\/products\/new$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "상품 등록" })).toBeVisible();
  await expect(page.getByText("카테고리 *")).toBeVisible();
  await expect(page.getByLabel(/제목/)).toBeVisible();
});
