import { expect, test } from "@playwright/test";

test("signup blocks invalid client-side form before API request", async ({ page }) => {
  let signupRequestCount = 0;

  page.on("request", (request) => {
    if (request.url().includes("/api/auth/signup")) {
      signupRequestCount += 1;
    }
  });

  await page.goto("/signup");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#password").fill("1234");
  await page.locator("#passwordConfirm").fill("12345");
  await page.locator("#nickname").fill("");
  const submitButton = page.locator('button[type="submit"]').last();

  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await page.waitForTimeout(500);

  expect(signupRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/signup$/);
});

test("signup rejects duplicate email and stays on signup page", async ({ page }) => {
  await page.goto("/signup");
  await page.locator("#email").fill("buyer@test.com");
  await page.locator("#password").fill("Test1234!");
  await page.locator("#passwordConfirm").fill("Test1234!");
  await page.locator("#nickname").fill("duplicate-check");
  const submitButton = page.locator('button[type="submit"]').last();

  const signupResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/signup"),
  );

  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });

  const signupResponse = await signupResponsePromise;
  expect([400, 409]).toContain(signupResponse.status());
  await expect(page).toHaveURL(/\/signup$/);
});

test("signup rejects duplicate nickname and stays on signup page", async ({ page }) => {
  await page.goto("/signup");
  await page.locator("#email").fill("fresh-duplicate-nickname@test.com");
  await page.locator("#password").fill("Test1234!");
  await page.locator("#passwordConfirm").fill("Test1234!");
  await page.locator("#nickname").fill("buyer");
  const submitButton = page.locator('button[type="submit"]').last();

  const signupResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/signup"),
  );

  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });

  const signupResponse = await signupResponsePromise;
  expect([400, 409]).toContain(signupResponse.status());
  await expect(page).toHaveURL(/\/signup$/);
});
