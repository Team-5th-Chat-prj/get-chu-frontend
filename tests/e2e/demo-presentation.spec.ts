import { expect, test } from "@playwright/test";

test("발표용 프론트 데모 영상", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(1200);

  await page.locator("#email").pressSequentially("buyer@test.com", { delay: 90 });
  await page.waitForTimeout(500);
  await page.locator("#password").pressSequentially("Test1234!", { delay: 90 });
  await page.waitForTimeout(700);

  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  await expect(page.locator("body")).toContainText("iPad Pro 11");
  await page.waitForTimeout(1800);

  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(1200);

  await page.getByText("iPad Pro 11").first().click();
  await page.waitForURL(/\/products\/1$/, { timeout: 15_000 });
  await page.waitForTimeout(2200);

  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1800);

  await page.goto("/nearby");
  await page.waitForTimeout(2500);

  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1800);

  await page.goto("/my");
  await page.waitForTimeout(2200);

  await page.getByText("찜 목록").click();
  await page.waitForURL(/\/my\/likes$/, { timeout: 15_000 });
  await page.waitForTimeout(2500);
});
