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

test("demo journey: buyer and seller exchange messages in two windows", async ({ browser }) => {
  const windowWidth = 960;
  const windowHeight = 1080;
  const viewportWidth = 900;
  const viewportHeight = 920;

  const buyerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });
  const sellerContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
  });

  try {
    const buyerPage = await buyerContext.newPage();
    let sellerPage = await sellerContext.newPage();

    await positionWindow(buyerPage, { left: 0, top: 0, width: windowWidth, height: windowHeight });
    await positionWindow(sellerPage, { left: windowWidth, top: 0, width: windowWidth, height: windowHeight });

    await loginAs(buyerPage, "buyer");
    await loginAs(sellerPage, "seller");

    await buyerPage.goto("/products/1");
    await expect(buyerPage.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();
    await buyerPage.waitForTimeout(1_800);

    const chatButton = buyerPage.getByTestId("product-chat-button");
    await chatButton.scrollIntoViewIfNeeded();
    await buyerPage.waitForTimeout(1_200);
    await chatButton.hover();
    await buyerPage.waitForTimeout(900);
    await chatButton.click();
    await buyerPage.waitForURL(/\/chat\/\d+$/, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_600);

    const chatRoomMatch = buyerPage.url().match(/\/chat\/(\d+)$/);
    expect(chatRoomMatch, "Chat room id should exist in the buyer URL.").not.toBeNull();
    const chatRoomId = Number(chatRoomMatch![1]);

    if (sellerPage.isClosed()) {
      sellerPage = await sellerContext.newPage();
      await positionWindow(sellerPage, { left: windowWidth, top: 0, width: windowWidth, height: windowHeight });
      await loginAs(sellerPage, "seller");
    }

    await sellerPage.goto(`/chat/${chatRoomId}`);
    await sellerPage.waitForTimeout(2_200);

    const buyerMessage = "안녕하세요! 아직 거래 가능한가요?";
    const sellerReply = "네, 가능합니다. 오늘 저녁에 작전동 근처에서 거래 가능하세요?";
    const buyerConfirm = "좋아요! 오후 7시쯤 가능해서 채팅으로 다시 연락드릴게요.";

    const buyerInput = buyerPage.locator('input[placeholder*="메시지"]');
    await buyerInput.click();
    await buyerInput.pressSequentially(buyerMessage, { delay: 95 });
    await buyerPage.waitForTimeout(1_000);
    await buyerInput.press("Enter");

    await expect(sellerPage.locator("body")).toContainText(buyerMessage, { timeout: 15_000 });
    await sellerPage.waitForTimeout(1_800);

    const sellerInput = sellerPage.locator('input[placeholder*="메시지"]');
    await sellerInput.click();
    await sellerInput.pressSequentially(sellerReply, { delay: 85 });
    await sellerPage.waitForTimeout(1_000);
    await sellerInput.press("Enter");

    await expect(buyerPage.locator("body")).toContainText(sellerReply, { timeout: 15_000 });
    await buyerPage.waitForTimeout(1_800);

    await buyerInput.click();
    await buyerInput.pressSequentially(buyerConfirm, { delay: 80 });
    await buyerPage.waitForTimeout(900);
    await buyerInput.press("Enter");

    await expect(sellerPage.locator("body")).toContainText(buyerConfirm, { timeout: 15_000 });
    await sellerPage.waitForTimeout(2_500);
  } finally {
    await buyerContext.close();
    await sellerContext.close();
  }
});
