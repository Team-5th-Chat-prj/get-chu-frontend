import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("buyer can open a chat room from seller product detail", async ({ page }) => {
  await loginAs(page, "buyer");
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "iPad Pro 11", level: 2 })).toBeVisible();

  const chatRoomResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/chat-rooms") &&
      response.request().method() === "POST",
  );

  await page.getByTestId("product-chat-button").click();

  const chatRoomResponse = await chatRoomResponsePromise;
  expect(
    chatRoomResponse.ok(),
    `Create chat room API failed. status=${chatRoomResponse.status()} body=${await chatRoomResponse.text()}`,
  ).toBeTruthy();

  await page.waitForURL(/\/chat\/\d+$/, { timeout: 15_000 });
});

test("buyer can open chat list without crashing", async ({ page }) => {
  await loginAs(page, "buyer");

  const chatRoomsResponsePromise = page
    .waitForResponse((response) => response.url().includes("/api/chat-rooms"), { timeout: 15_000 })
    .catch(() => null);

  await page.goto("/chat");

  const chatRoomsResponse = await chatRoomsResponsePromise;
  expect(chatRoomsResponse, "Chat rooms API did not respond. Check that the backend is running.").not.toBeNull();
  expect(
    chatRoomsResponse!.ok(),
    `Chat rooms API failed. status=${chatRoomsResponse!.status()} body=${await chatRoomsResponse!.text()}`,
  ).toBeTruthy();
});
