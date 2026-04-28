import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("unauthenticated user is redirected to login when trying to reserve from product detail", async ({ page }) => {
  await page.goto("/products/1");
  await page.getByTestId("product-reserve-button").click();

  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});

test("unauthenticated user is redirected to login when trying to chat from product detail", async ({ page }) => {
  await page.goto("/products/1");
  await page.getByTestId("product-chat-button").click();

  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});

test("unauthenticated user is redirected to login when trying to like from product detail", async ({ page }) => {
  await page.goto("/products/1");
  await page.getByTestId("product-like-button").click();

  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});

test("password change rejects wrong current password and stays on form page", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/my/password");
  await page.locator("#oldPassword").fill("Wrong1234!");
  await page.locator("#newPassword").fill("NewTest1234!");
  await page.locator("#confirmPassword").fill("NewTest1234!");
  const submitButton = page.locator('button[type="submit"]').last();

  const updatePasswordResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/members/me/password") && response.request().method() === "PATCH",
  );

  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });

  const updatePasswordResponse = await updatePasswordResponsePromise;
  expect([400, 403]).toContain(updatePasswordResponse.status());
  await expect(page).toHaveURL(/\/my\/password$/);
});
