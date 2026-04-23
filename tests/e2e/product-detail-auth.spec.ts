import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("buyer sees trade actions on seller product detail", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1");

  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();
  await expect(page.getByTestId("product-like-button")).toBeVisible();
  await expect(page.getByTestId("product-reserve-button")).toBeVisible();
  await expect(page.getByTestId("product-chat-button")).toBeVisible();
  await expect(page.getByTestId("product-edit-button")).toHaveCount(0);
});

test("seller sees edit action and cannot like own product", async ({ page }) => {
  await loginAs(page, "seller");
  await page.goto("/products/1");

  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();
  await expect(page.getByTestId("product-edit-button")).toBeVisible();
  await expect(page.getByTestId("product-like-button")).toHaveCount(0);
  await expect(page.getByTestId("product-reserve-button")).toHaveCount(0);
  await expect(page.getByTestId("product-chat-button")).toHaveCount(0);
});
