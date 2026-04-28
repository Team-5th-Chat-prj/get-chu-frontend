import { expect, type Locator, type Page, test } from "@playwright/test";
import { installDemoNicknameMask, loginWithCredentials } from "./helpers/demo";
import { loadDemoJourneyState } from "./helpers/demoState";
import { loginAs } from "./helpers/auth";

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

async function positionWindow(page: Page, bounds: { left: number; top: number; width: number; height: number }) {
  const session = await page.context().newCDPSession(page);
  const { windowId } = await session.send("Browser.getWindowForTarget");

  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: {
      windowState: "normal",
      ...bounds,
    },
  });
}

async function extractOwnerReviewStats(page: Page) {
  const bodyText = (await page.locator("body").textContent()) ?? "";
  const ratingMatch = bodyText.match(/평점\s*([0-9.]+)/);
  const reviewCountMatch = bodyText.match(/리뷰\s*(\d+)개/);

  expect(ratingMatch, "Owner my page should expose average rating.").toBeTruthy();
  expect(reviewCountMatch, "Owner my page should expose review count.").toBeTruthy();

  return {
    averageRating: Number(ratingMatch![1]),
    reviewCount: Number(reviewCountMatch![1]),
  };
}

async function openMyDashboard(page: Page) {
  await page.goto("/my");
  await expect(page.locator("body")).toContainText(/마이페이지|buyer|seller|테스트/, { timeout: 15_000 });
  await page.waitForTimeout(700);
}

async function getTradeCardByTitle(page: Page, prefix: string, title: string) {
  return page.locator(`[data-testid^='${prefix}']`).filter({ hasText: title }).first();
}

async function waitForVisibleCard(card: Locator) {
  await expect(card).toBeVisible({ timeout: 15_000 });
}

test("demo journey: my page trade flow and review", async ({ browser }) => {
  const demoState = await loadDemoJourneyState().catch(() => null);
  expect(
    demoState,
    "Journey demo state was not found. Run `pnpm test:e2e:demo:journey` first to create the test account and reservation.",
  ).toBeTruthy();

  const windowWidth = 960;
  const windowHeight = 1080;
  const viewportWidth = 900;
  const viewportHeight = 920;
  const reviewContent = "약속 시간 맞춰서 친절하게 거래했어요.";

  const buyerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });
  const ownerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });

  try {
    await installDemoNicknameMask(buyerContext);
    await installDemoNicknameMask(ownerContext);

    const buyerPage = await buyerContext.newPage();
    const ownerPage = await ownerContext.newPage();

    const monitorOffsetX = 1920;

    await positionWindow(buyerPage, {
      left: monitorOffsetX,
      top: 0,
      width: windowWidth,
      height: windowHeight,
    });
    await positionWindow(ownerPage, {
      left: monitorOffsetX + windowWidth,
      top: 0,
      width: windowWidth,
      height: windowHeight,
    });

    await loginWithCredentials(buyerPage, demoState!.account);
    await loginAs(ownerPage, demoState!.ownerAccount);

    await Promise.all([openMyDashboard(buyerPage), openMyDashboard(ownerPage)]);

    const ownerStatsBefore = await extractOwnerReviewStats(ownerPage);
    const expectedReviewCount = ownerStatsBefore.reviewCount + 1;
    const expectedAverageRating = roundToOneDecimal(
      (ownerStatsBefore.averageRating * ownerStatsBefore.reviewCount + 5) / expectedReviewCount,
    );

    await buyerPage.getByRole("button", { name: /구매 목록/ }).click();
    await ownerPage.getByRole("button", { name: /판매 목록/ }).click();
    await buyerPage.waitForURL("/my/purchases", { timeout: 15_000 });
    await ownerPage.waitForURL("/my/products", { timeout: 15_000 });
    await buyerPage.waitForTimeout(600);
    await ownerPage.waitForTimeout(600);

    await buyerPage.getByTestId("buyer-trades-tab-RESERVED").click();
    await ownerPage.getByTestId("seller-products-tab-RESERVED").click();
    await buyerPage.waitForTimeout(500);
    await ownerPage.waitForTimeout(500);

    const buyerReservedCard = await getTradeCardByTitle(buyerPage, "buyer-trade-card-", demoState!.productTitle);
    const ownerReservedCard = await getTradeCardByTitle(ownerPage, "seller-product-card-", demoState!.productTitle);

    await waitForVisibleCard(buyerReservedCard);
    await waitForVisibleCard(ownerReservedCard);
    await buyerPage.waitForTimeout(700);
    await ownerPage.waitForTimeout(700);

    await ownerReservedCard.locator("[data-testid^='seller-confirm-trade-button-']").click();
    await ownerPage.waitForTimeout(1300);

    await buyerPage.reload();
    await ownerPage.reload();
    await buyerPage.waitForTimeout(700);
    await ownerPage.waitForTimeout(700);

    await buyerPage.getByTestId("buyer-trades-tab-TRADING").click();
    await ownerPage.getByTestId("seller-products-tab-TRADING").click();
    await buyerPage.waitForTimeout(500);
    await ownerPage.waitForTimeout(500);

    const buyerTradingCard = await getTradeCardByTitle(buyerPage, "buyer-trade-card-", demoState!.productTitle);
    const ownerTradingCard = await getTradeCardByTitle(ownerPage, "seller-product-card-", demoState!.productTitle);

    await waitForVisibleCard(buyerTradingCard);
    await waitForVisibleCard(ownerTradingCard);
    await buyerPage.waitForTimeout(700);

    await buyerTradingCard.locator("[data-testid^='buyer-complete-trade-button-']").click();
    await buyerPage.waitForTimeout(1300);

    await buyerPage.reload();
    await ownerPage.reload();
    await buyerPage.waitForTimeout(700);
    await ownerPage.waitForTimeout(700);

    await buyerPage.getByTestId("buyer-trades-tab-SOLD").click();
    await ownerPage.getByTestId("seller-products-tab-SOLD_OUT").click();
    await buyerPage.waitForTimeout(500);
    await ownerPage.waitForTimeout(500);

    const buyerSoldCard = buyerPage.locator("[data-testid^='buyer-trade-card-']").filter({
      hasText: demoState!.productTitle,
      has: buyerPage.locator("[data-testid^='buyer-write-review-button-']"),
    }).first();
    const ownerSoldCard = await getTradeCardByTitle(ownerPage, "seller-product-card-", demoState!.productTitle);

    await waitForVisibleCard(buyerSoldCard);
    await waitForVisibleCard(ownerSoldCard);
    await buyerPage.waitForTimeout(700);

    await buyerSoldCard.locator("[data-testid^='buyer-write-review-button-']").click();
    await buyerPage.waitForURL(/\/trades\/\d+\/review$/, { timeout: 15_000 });
    await buyerPage.waitForTimeout(700);

    await buyerPage.getByTestId("review-star-5").click();
    await buyerPage.waitForTimeout(350);
    await buyerPage.getByTestId("review-content-input").fill(reviewContent);
    await buyerPage.waitForTimeout(550);
    await buyerPage.getByTestId("review-submit-button").click();
    await buyerPage.waitForURL("/my/purchases", { timeout: 15_000 });
    await buyerPage.waitForTimeout(700);

    await Promise.all([openMyDashboard(buyerPage), openMyDashboard(ownerPage)]);

    await expect(ownerPage.locator("body")).toContainText(new RegExp(`리뷰\\s*${expectedReviewCount}개`), {
      timeout: 15_000,
    });
    await expect(ownerPage.locator("body")).toContainText(expectedAverageRating.toFixed(1), { timeout: 15_000 });

    await buyerPage.getByRole("button", { name: /내가 작성한 리뷰/ }).click();
    await buyerPage.waitForURL("/my/reviews/written", { timeout: 15_000 });
    await expect(buyerPage.locator("body")).toContainText(reviewContent, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1000);

    await ownerPage.getByRole("button", { name: new RegExp(`리뷰\\s*${expectedReviewCount}개`) }).click();
    await ownerPage.waitForURL(new RegExp(`/members/${demoState!.ownerMemberId}/reviews$`), { timeout: 15_000 });
    await expect(ownerPage.locator("body")).toContainText(reviewContent, { timeout: 15_000 });
    await expect(ownerPage.locator("body")).toContainText(expectedAverageRating.toFixed(1), { timeout: 15_000 });
    await ownerPage.waitForTimeout(1400);
  } finally {
    await buyerContext.close();
    await ownerContext.close();
  }
});
