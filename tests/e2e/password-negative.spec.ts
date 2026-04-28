import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("password change blocks invalid new password before API request", async ({ page }) => {
  let updatePasswordRequestCount = 0;

  page.on("request", (request) => {
    if (
      request.url().includes("/api/members/me/password") &&
      request.method() === "PATCH"
    ) {
      updatePasswordRequestCount += 1;
    }
  });

  await loginAs(page, "buyer");
  await page.goto("/my/password");
  await page.locator("#oldPassword").fill("Test1234!");
  await page.locator("#newPassword").fill("1234");
  await page.locator("#confirmPassword").fill("1234");

  const submitButton = page.locator('button[type="submit"]').last();
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(400);

  expect(updatePasswordRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/my\/password$/);
});

test("password change blocks mismatched confirmation before API request", async ({ page }) => {
  let updatePasswordRequestCount = 0;

  page.on("request", (request) => {
    if (
      request.url().includes("/api/members/me/password") &&
      request.method() === "PATCH"
    ) {
      updatePasswordRequestCount += 1;
    }
  });

  await loginAs(page, "buyer");
  await page.goto("/my/password");
  await page.locator("#oldPassword").fill("Test1234!");
  await page.locator("#newPassword").fill("NewTest1234!");
  await page.locator("#confirmPassword").fill("Different1234!");

  const submitButton = page.locator('button[type="submit"]').last();
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(400);

  expect(updatePasswordRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/my\/password$/);
});
