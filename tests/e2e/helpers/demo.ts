import { expect, type BrowserContext, type Page } from "@playwright/test";

const DEMO_DISPLAY_NICKNAME = "\uD14C\uC2A4\uD2B8";

export type DemoAccount = {
  displayEmail: string;
  displayNickname: string;
  actualEmail: string;
  actualNickname: string;
  password: string;
};

function createDemoAccount(): DemoAccount {
  const stamp = Date.now();

  return {
    displayEmail: "test@test.com",
    displayNickname: DEMO_DISPLAY_NICKNAME,
    actualEmail: `test.${stamp}@test.com`,
    actualNickname: `${DEMO_DISPLAY_NICKNAME}${stamp}`,
    password: "Test1234!",
  };
}

export async function installDemoNicknameMask(context: BrowserContext) {
  await context.addInitScript((displayNickname: string) => {
    const replaceNickname = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];

      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
      }

      for (const node of textNodes) {
        const value = node.textContent ?? "";
        const nextValue = value.replace(new RegExp(`${displayNickname}\\d+`, "g"), displayNickname);

        if (nextValue !== value) {
          node.textContent = nextValue;
        }
      }
    };

    const start = () => {
      replaceNickname();
      const observer = new MutationObserver(() => replaceNickname());
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }, DEMO_DISPLAY_NICKNAME);
}

export async function signupFreshAccount(page: Page) {
  const account = createDemoAccount();

  await page.goto("/signup");

  await page.locator("#email").fill(account.displayEmail);
  await page.locator("#nickname").fill(account.displayNickname);
  await page.locator("#password").fill(account.password);
  await page.locator("#passwordConfirm").fill(account.password);

  await page.route("**/api/auth/signup", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;

    await route.continue({
      postData: JSON.stringify({
        ...payload,
        email: account.actualEmail,
        nickname: account.actualNickname,
      }),
      headers: {
        ...route.request().headers(),
        "content-type": "application/json",
      },
    });
  });

  const signupResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/auth/signup"), { timeout: 15_000 })
    .catch(() => null);

  await page.locator('form button[type="submit"]').click();

  const signupResponse = await signupResponsePromise;
  await page.unroute("**/api/auth/signup");

  expect(signupResponse, "Signup API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    signupResponse!.ok(),
    `Signup API failed. status=${signupResponse!.status()} body=${await signupResponse!.text()}`,
  ).toBeTruthy();

  await page.waitForURL((url) => url.pathname === "/login", { timeout: 15_000 });

  return account;
}

export async function loginWithCredentials(page: Page, account: DemoAccount) {
  await page.goto("/login");
  await page.locator("#email").fill(account.displayEmail);
  await page.locator("#password").fill(account.password);

  await page.route("**/api/auth/login", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;

    await route.continue({
      postData: JSON.stringify({
        ...payload,
        email: account.actualEmail,
        password: account.password,
      }),
      headers: {
        ...route.request().headers(),
        "content-type": "application/json",
      },
    });
  });

  const loginResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/auth/login"), { timeout: 15_000 })
    .catch(() => null);

  await page.locator('form button[type="submit"]').click();

  const loginResponse = await loginResponsePromise;
  await page.unroute("**/api/auth/login");

  expect(loginResponse, "Login API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    loginResponse!.ok(),
    `Login API failed. status=${loginResponse!.status()} body=${await loginResponse!.text()}`,
  ).toBeTruthy();
}

export async function verifyLocationByAddress(page: Page, address: string) {
  await page.waitForURL((url) => url.pathname === "/location/verify", { timeout: 15_000 });

  await page.getByRole("tab", { name: /직접 입력/ }).click();
  await page.getByPlaceholder(/동네명을 입력/i).fill(address);
  await page.getByRole("button", { name: /동네 후보 찾기/ }).click();

  const sdkErrorLocator = page.getByText(/카카오.*SDK 로드에 실패했어요|카카오.*지도를 불러오지 못했어요/);
  const candidateLocator = page.locator("button").filter({ hasText: /계양구.*작전|작전.*계양구/ }).first();

  const outcome = await Promise.race([
    sdkErrorLocator.waitFor({ state: "visible", timeout: 10_000 }).then(() => "sdk-error" as const),
    candidateLocator.waitFor({ state: "visible", timeout: 10_000 }).then(() => "candidate" as const),
  ]).catch(() => "timeout" as const);

  if (outcome === "sdk-error") {
    throw new Error("Kakao map SDK failed to load. Check VITE_KAKAO_MAP_KEY and Kakao web domain settings.");
  }

  if (outcome === "timeout") {
    if (await sdkErrorLocator.isVisible().catch(() => false)) {
      throw new Error("Kakao map SDK failed to load. Check VITE_KAKAO_MAP_KEY and Kakao web domain settings.");
    }

    throw new Error(`No address candidates appeared for "${address}".`);
  }

  await candidateLocator.click();

  const confirmButton = page.getByRole("button", { name: /네,\s*맞아요/ });
  await expect(confirmButton).toBeVisible({ timeout: 10_000 });
  await confirmButton.click();

  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
}

export async function openNearbyAndCheck(page: Page) {
  await page.goto("/nearby");
  await expect(page.getByRole("heading", { name: /가까운 상품/i })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2_500);

  const nearbyError = page.getByText(/근처 상품을 불러오지 못했어요/);
  if (await nearbyError.isVisible().catch(() => false)) {
    throw new Error("Nearby products page loaded, but nearby-products API returned an error state.");
  }

  await expect(page.locator("body")).toContainText(/기준 위치/);
}

export async function openMyPageAndCheckLocation(page: Page) {
  await page.goto("/my");
  await expect(page.locator("body")).toContainText(/인증된 동네/);
}
