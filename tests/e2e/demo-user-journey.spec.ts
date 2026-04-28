import { expect, test } from "@playwright/test";
import {
  loginWithCredentials,
  openMyPageAndCheckLocation,
  openNearbyAndCheck,
  signupFreshAccount,
  verifyLocationByAddress,
} from "./helpers/demo";

test("demo journey: signup, login, location verify, nearby, my page", async ({ page }) => {
  const account = await signupFreshAccount(page);
  await page.waitForTimeout(1_000);

  await loginWithCredentials(page, account);
  await verifyLocationByAddress(page, "인천 계양구 작전동");
  await page.waitForTimeout(1_500);

  await expect(page.locator("body")).toContainText(/Get-chu|중고 마켓|추천 상품/i);
  await page.waitForTimeout(1_500);

  await openNearbyAndCheck(page);
  await page.waitForTimeout(1_500);

  await openMyPageAndCheckLocation(page);
  await page.waitForTimeout(2_000);
});
