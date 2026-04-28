import { expect, type Page, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { installDemoNicknameMask, loginWithCredentials, signupFreshAccount, verifyLocationByAddress } from "./helpers/demo";
import { clearDemoJourneyState, saveDemoJourneyState } from "./helpers/demoState";

type TestAccount = "buyer" | "seller";

type NearbyApiProduct = {
  id: number;
  title: string;
  status: string;
  sellerNickname: string;
};

type NearbyApiResponse = {
  data?: {
    content?: NearbyApiProduct[];
  };
};

type VisibleNearbyProduct = {
  id: number;
  title: string;
};

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

function toOwnerAccount(sellerNickname: string): TestAccount {
  return sellerNickname === "buyer" ? "buyer" : "seller";
}

async function getFirstVisibleNearbyCard(page: Page) {
  const cards = page.locator("[data-testid^='product-card-']");
  const count = await cards.count();

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);

    if (!(await card.isVisible())) {
      continue;
    }

    const cardText = (await card.textContent()) ?? "";
    if (!cardText.includes("판매중")) {
      continue;
    }

    const testId = await card.getAttribute("data-testid");
    const id = Number(testId?.replace("product-card-", ""));
    const title = ((await card.locator("h3").textContent()) ?? "").trim();

    if (!Number.isNaN(id) && title) {
      return { id, title } satisfies VisibleNearbyProduct;
    }
  }

  throw new Error("No nearby product card is visible on the page.");
}

async function waitForChatRoomCardWithRefresh(page: Page, title: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const roomCard = page.locator("article").filter({ hasText: title }).first();

    if (await roomCard.isVisible().catch(() => false)) {
      return roomCard;
    }

    await page.reload();
    await page.waitForURL("/chat", { timeout: 15_000 });
    await page.waitForTimeout(700);
  }

  throw new Error(`Chat room card for "${title}" did not appear in the waiting owner chat list.`);
}

test("demo journey: signup, nearby product, chat, and reserve", async ({ browser }) => {
  const buyerWideWidth = 1360;
  const ownerNarrowWidth = 560;
  const fullHeight = 1080;
  const buyerWideViewport = { width: 1300, height: 920 };
  const ownerNarrowViewport = { width: 500, height: 920 };
  const splitWidth = 960;
  const splitViewport = { width: 900, height: 920 };

  const buyerContext = await browser.newContext({ viewport: buyerWideViewport });
  const ownerContext = await browser.newContext({ viewport: ownerNarrowViewport });

  try {
    await clearDemoJourneyState();
    await installDemoNicknameMask(buyerContext);
    await installDemoNicknameMask(ownerContext);

    const buyerPage = await buyerContext.newPage();
    const ownerPage = await ownerContext.newPage();

    const monitorOffsetX = 1920;

    await positionWindow(buyerPage, {
      left: monitorOffsetX,
      top: 0,
      width: buyerWideWidth,
      height: fullHeight,
    });

    await positionWindow(ownerPage, {
      left: monitorOffsetX + buyerWideWidth,
      top: 0,
      width: ownerNarrowWidth,
      height: fullHeight,
    });

    const account = await signupFreshAccount(buyerPage);
    await buyerPage.waitForTimeout(800);

    await loginWithCredentials(buyerPage, account);
    await buyerPage.waitForTimeout(700);

    await verifyLocationByAddress(buyerPage, "인천 계양구 작전동");
    await buyerPage.waitForTimeout(800);

    await expect(buyerPage.locator("body")).toContainText(/Get-chu|중고 마켓|추천 상품/i);
    await buyerPage.waitForTimeout(700);

    const nearbyButton = buyerPage.getByRole("button", { name: /내 근처 상품/ });
    await expect(nearbyButton).toBeVisible({ timeout: 10_000 });
    await nearbyButton.hover();
    await buyerPage.waitForTimeout(350);
    await nearbyButton.click();
    await buyerPage.waitForURL("/nearby", { timeout: 15_000 });
    await buyerPage.waitForTimeout(650);

    const radiusButton = buyerPage.getByRole("button", { name: "10km" });
    await expect(radiusButton).toBeVisible({ timeout: 10_000 });
    await radiusButton.hover();
    await buyerPage.waitForTimeout(300);

    const nearbyResponsePromise = buyerPage.waitForResponse(
      (response) =>
        response.url().includes("/api/products/nearby") &&
        response.url().includes("radius=10") &&
        response.request().method() === "GET",
      { timeout: 15_000 },
    );

    await radiusButton.click();

    const nearbyResponse = await nearbyResponsePromise;
    expect(nearbyResponse.ok(), "Nearby products API should respond successfully.").toBeTruthy();
    await buyerPage.waitForTimeout(750);

    const nearbyPayload = (await nearbyResponse.json()) as NearbyApiResponse;
    const visibleNearbyProduct = await getFirstVisibleNearbyCard(buyerPage);
    const nearbyProduct = nearbyPayload.data?.content?.find((product) => product.id === visibleNearbyProduct.id);

    expect(nearbyProduct, "The visible nearby product should exist in the API response.").toBeTruthy();

    const ownerAccount = toOwnerAccount(nearbyProduct!.sellerNickname);
    const ownerMemberId = ownerAccount === "seller" ? 2 : 1;

    await loginAs(ownerPage, ownerAccount);
    await ownerPage.goto("/chat");
    await ownerPage.waitForTimeout(700);

    const nearbyCard = buyerPage.getByTestId(`product-card-${visibleNearbyProduct.id}`);
    await nearbyCard.scrollIntoViewIfNeeded();
    await buyerPage.waitForTimeout(500);
    await nearbyCard.hover();
    await buyerPage.waitForTimeout(350);
    await nearbyCard.click();

    await buyerPage.waitForURL(new RegExp(`/products/${visibleNearbyProduct.id}$`), { timeout: 15_000 });
    await expect(buyerPage.locator("h1").first()).toContainText(visibleNearbyProduct.title);
    await buyerPage.waitForTimeout(750);

    const chatButton = buyerPage.getByTestId("product-chat-button");
    await chatButton.scrollIntoViewIfNeeded();
    await buyerPage.waitForTimeout(700);
    await chatButton.hover();
    await buyerPage.waitForTimeout(450);

    await buyerPage.setViewportSize(splitViewport);
    await ownerPage.setViewportSize(splitViewport);
    await positionWindow(buyerPage, {
      left: monitorOffsetX,
      top: 0,
      width: splitWidth,
      height: fullHeight,
    });
    await positionWindow(ownerPage, {
      left: monitorOffsetX + splitWidth,
      top: 0,
      width: splitWidth,
      height: fullHeight,
    });
    await buyerPage.waitForTimeout(500);

    await chatButton.click();
    await buyerPage.waitForURL(/\/chat\/\d+$/, { timeout: 15_000 });
    await buyerPage.waitForTimeout(750);

    const buyerMessage = "안녕하세요! 아직 거래 가능한가요?";
    const ownerReply = "네, 가능합니다. 오늘 저녁에 작전동 근처에서 거래 가능하세요?";
    const buyerConfirm = "좋아요! 그럼 채팅에서 예약하고 진행할게요.";

    const buyerInput = buyerPage.locator('input[placeholder*="메시지"]');
    await buyerInput.click();
    await buyerInput.pressSequentially(buyerMessage, { delay: 95 });
    await buyerPage.waitForTimeout(600);
    await buyerInput.press("Enter");

    const newRoomCard = await waitForChatRoomCardWithRefresh(ownerPage, visibleNearbyProduct.title);
    await ownerPage.waitForTimeout(500);
    await newRoomCard.click();
    await ownerPage.waitForURL(/\/chat\/\d+$/, { timeout: 15_000 });
    await expect(ownerPage.getByText(buyerMessage)).toBeVisible({ timeout: 15_000 });
    await ownerPage.waitForTimeout(700);

    const ownerInput = ownerPage.locator('input[placeholder*="메시지"]');
    await ownerInput.click();
    await ownerInput.pressSequentially(ownerReply, { delay: 85 });
    await ownerPage.waitForTimeout(550);
    await ownerInput.press("Enter");
    await buyerPage.waitForTimeout(1100);

    await buyerInput.click();
    await buyerInput.pressSequentially(buyerConfirm, { delay: 80 });
    await buyerPage.waitForTimeout(550);
    await buyerInput.press("Enter");
    await ownerPage.waitForTimeout(1100);

    const unavailableReserveButton = buyerPage.getByRole("button", { name: /지금은 예약할 수 없어요/ });
    if (await unavailableReserveButton.isVisible().catch(() => false)) {
      throw new Error("The selected demo product is already reserved. Reset the backend seed state before recording.");
    }

    const reserveFromChatButton = buyerPage.getByRole("button", { name: /이 채팅에서 예약하기/ });
    await expect(reserveFromChatButton).toBeVisible({ timeout: 10_000 });
    await reserveFromChatButton.hover();
    await buyerPage.waitForTimeout(400);

    const reserveResponsePromise = buyerPage.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${visibleNearbyProduct.id}/reserve`) &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await reserveFromChatButton.click();

    const reserveResponse = await reserveResponsePromise;
    expect(reserveResponse.ok(), "Reserve API should complete successfully before ending the journey demo.").toBeTruthy();
    await buyerPage.waitForTimeout(1500);

    await saveDemoJourneyState({
      account,
      productId: visibleNearbyProduct.id,
      productTitle: visibleNearbyProduct.title,
      ownerAccount,
      ownerMemberId,
    });
  } finally {
    await buyerContext.close();
    await ownerContext.close();
  }
});
