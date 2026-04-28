import { expect, test } from "@playwright/test";

test("unauthenticated private member APIs are rejected", async ({ request }) => {
  const meResponse = await request.get("/api/members/me");
  expect(meResponse.ok()).toBeFalsy();

  const tradesResponse = await request.get("/api/members/me/trades?role=BUYER");
  expect(tradesResponse.ok()).toBeFalsy();

  const likesResponse = await request.get("/api/members/me/likes");
  expect(likesResponse.ok()).toBeFalsy();

  const reserveResponse = await request.post("/api/products/1/reserve");
  expect(reserveResponse.ok()).toBeFalsy();

  const chatRoomResponse = await request.post("/api/chat-rooms", {
    data: { productId: 1, sellerId: 2 },
  });
  expect(chatRoomResponse.ok()).toBeFalsy();
});
