import { expect, Page, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

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

async function findReservableProduct(page: Page, candidateIds: number[]) {
  for (const productId of candidateIds) {
    await page.goto(`/products/${productId}`);

    const reserveButton = page.getByTestId("product-reserve-button");
    const chatButton = page.getByTestId("product-chat-button");

    if ((await reserveButton.count()) === 0 || (await chatButton.count()) === 0) {
      continue;
    }

    if (await reserveButton.isDisabled()) {
      continue;
    }

    const title = (await page.locator("h1").first().innerText()).trim();
    return { productId, title, reserveButton, chatButton };
  }

  throw new Error("No reservable seller seed product is available. Reset the backend seed data before recording this demo.");
}

test("demo journey: product detail to chat, reserve, trade, and review", async ({ browser }) => {
  const windowWidth = 960;
  const windowHeight = 1080;
  const viewportWidth = 900;
  const viewportHeight = 920;
  const reviewContent = `약속 시간 잘 맞춰서 친절하게 거래했어요. ${Date.now()}`;

  const buyerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });
  const sellerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });

  try {
    const buyerPage = await buyerContext.newPage();
    const sellerPage = await sellerContext.newPage();

    await positionWindow(buyerPage, { left: 0, top: 0, width: windowWidth, height: windowHeight });
    await positionWindow(sellerPage, { left: windowWidth, top: 0, width: windowWidth, height: windowHeight });

    await loginAs(buyerPage, "buyer");
    await loginAs(sellerPage, "seller");

    const candidateIds = [1, 2, 3, 200, 201, 202, 203, 204, 205, 206, 210, 211, 212, 213, 214, 215, 216];
    const { title: productTitle, chatButton } = await findReservableProduct(buyerPage, candidateIds);
    await expect(buyerPage.locator("h1").first()).toContainText(productTitle);
    await buyerPage.waitForTimeout(1_600);

    await chatButton.scrollIntoViewIfNeeded();
    await buyerPage.waitForTimeout(1_200);
    await chatButton.hover();
    await buyerPage.waitForTimeout(1_000);

    await chatButton.click();
    await buyerPage.waitForURL(/\/chat\/\d+$/, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_400);

    const chatRoomMatch = buyerPage.url().match(/\/chat\/(\d+)$/);
    expect(chatRoomMatch, "Chat room id should exist in the buyer URL.").not.toBeNull();
    const chatRoomId = Number(chatRoomMatch![1]);

    await sellerPage.goto(`/chat/${chatRoomId}`);
    await sellerPage.waitForTimeout(2_000);

    const buyerMessage = "안녕하세요! 아직 거래 가능한가요?";
    const sellerReply = "네, 가능합니다. 오늘 저녁에 작전동 근처에서 거래 가능하세요?";
    const buyerConfirm = "좋아요! 그럼 이 채팅에서 예약하고 진행할게요.";

    const buyerInput = buyerPage.locator('input[placeholder*="메시지"]');
    await buyerInput.click();
    await buyerInput.pressSequentially(buyerMessage, { delay: 95 });
    await buyerPage.waitForTimeout(1_000);
    await buyerInput.press("Enter");
    await expect(sellerPage.locator("body")).toContainText(buyerMessage, { timeout: 15_000 });
    await sellerPage.waitForTimeout(1_500);

    const sellerInput = sellerPage.locator('input[placeholder*="메시지"]');
    await sellerInput.click();
    await sellerInput.pressSequentially(sellerReply, { delay: 85 });
    await sellerPage.waitForTimeout(1_000);
    await sellerInput.press("Enter");
    await expect(buyerPage.locator("body")).toContainText(sellerReply, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_500);

    await buyerInput.click();
    await buyerInput.pressSequentially(buyerConfirm, { delay: 80 });
    await buyerPage.waitForTimeout(900);
    await buyerInput.press("Enter");
    await expect(sellerPage.locator("body")).toContainText(buyerConfirm, { timeout: 15_000 });
    await sellerPage.waitForTimeout(1_800);

    const reserveFromChatButton = buyerPage.getByRole("button", { name: "이 채팅에서 예약하기" });
    await expect(reserveFromChatButton).toBeVisible({ timeout: 10_000 });
    await reserveFromChatButton.hover();
    await buyerPage.waitForTimeout(800);
    await reserveFromChatButton.click();
    await buyerPage.waitForTimeout(1_800);

    await Promise.all([buyerPage.goto("/my/purchases"), sellerPage.goto("/my/products")]);
    await buyerPage.waitForTimeout(1_400);
    await sellerPage.waitForTimeout(1_400);

    await sellerPage.getByTestId("seller-products-tab-RESERVED").click();
    await sellerPage.waitForTimeout(1_200);

    const sellerReservedCard = sellerPage.locator("[data-testid^='seller-product-card-']", { hasText: productTitle }).first();
    await expect(sellerReservedCard).toBeVisible({ timeout: 15_000 });
    await expect(sellerReservedCard.locator("[data-testid^='seller-confirm-trade-button-']")).toBeVisible();
    await expect(buyerPage.locator("[data-testid^='buyer-trade-card-']", { hasText: productTitle }).first()).toBeVisible({
      timeout: 15_000,
    });
    await buyerPage.waitForTimeout(1_800);

    await sellerReservedCard.locator("[data-testid^='seller-confirm-trade-button-']").click();
    await sellerPage.waitForTimeout(2_000);

    await buyerPage.reload();
    await buyerPage.waitForTimeout(1_400);
    await buyerPage.getByTestId("buyer-trades-tab-TRADING").click();
    await buyerPage.waitForTimeout(1_200);

    const buyerTradingCard = buyerPage.locator("[data-testid^='buyer-trade-card-']", { hasText: productTitle }).first();
    await expect(buyerTradingCard).toBeVisible({ timeout: 15_000 });
    await buyerPage.waitForTimeout(1_400);
    await buyerTradingCard.locator("[data-testid^='buyer-complete-trade-button-']").click();
    await buyerPage.waitForTimeout(2_000);

    await buyerPage.reload();
    await buyerPage.waitForTimeout(1_300);
    await buyerPage.getByTestId("buyer-trades-tab-SOLD").click();
    await buyerPage.waitForTimeout(1_200);

    const buyerSoldCard = buyerPage.locator("[data-testid^='buyer-trade-card-']", { hasText: productTitle }).first();
    await expect(buyerSoldCard).toBeVisible({ timeout: 15_000 });
    await buyerPage.waitForTimeout(1_300);
    await buyerSoldCard.locator("[data-testid^='buyer-write-review-button-']").click();
    await buyerPage.waitForURL(/\/trades\/\d+\/review$/, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_500);

    await buyerPage.getByTestId("review-star-5").click();
    await buyerPage.waitForTimeout(800);
    await buyerPage.getByTestId("review-content-input").fill(reviewContent);
    await buyerPage.waitForTimeout(1_000);
    await buyerPage.getByTestId("review-submit-button").click();
    await buyerPage.waitForURL("/my/purchases", { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_600);

    await buyerPage.goto("/members/2/reviews");
    await expect(buyerPage.locator("body")).toContainText(reviewContent, { timeout: 15_000 });
    await buyerPage.waitForTimeout(2_400);
  } finally {
    await buyerContext.close();
    await sellerContext.close();
  }
});
