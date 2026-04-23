import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("seller can open own product edit page with existing values", async ({ page }) => {
  await loginAs(page, "seller");
  await page.goto("/products/1");
  await page.getByTestId("product-edit-button").click();

  await expect(page).toHaveURL(/\/products\/1\/edit$/);
  await expect(page.locator("#title")).toHaveValue("iPad Pro 11");
  await expect(page.locator("#price")).toHaveValue("550000");
});
