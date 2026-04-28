import { test, expect } from "@playwright/test";

test("로그인 데모 영상", async ({ page }) => {
    await page.goto("/login");
    await page.waitForTimeout(1000);

    await page.locator('input[type="email"]').fill("test@test.com");
    await page.waitForTimeout(500);

    await page.locator('input[type="password"]').fill("1234");
    await page.waitForTimeout(500);

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(page).not.toHaveURL(/login/);
});