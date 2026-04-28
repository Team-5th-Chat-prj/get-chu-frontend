import { expect, test, type APIRequestContext } from "@playwright/test";

type TestAccount = "buyer" | "seller";

async function getAccessToken(request: APIRequestContext, account: TestAccount) {
  const response = await request.post("/api/auth/login", {
    data: {
      email: `${account}@test.com`,
      password: "Test1234!",
    },
  });

  expect(
    response.ok(),
    `Login API failed. status=${response.status()} body=${await response.text()}`,
  ).toBeTruthy();

  const body = await response.json();
  return body.data.accessToken as string;
}

test("seed product API returns frontend expected fields", async ({ request }) => {
  const response = await request.get("/api/products/1");

  expect(
    response.ok(),
    `Product detail API failed. status=${response.status()} body=${await response.text()}`,
  ).toBeTruthy();

  const body = await response.json();
  expect(body.data).toMatchObject({
    id: 1,
    title: "iPad Pro 11",
    status: "SALE",
  });
  expect(typeof body.data.sellerNickname).toBe("string");
  expect(body.data.sellerNickname.length).toBeGreaterThan(0);
  expect(typeof body.data.likeCount).toBe("number");
});

test("buyer auth token can read my profile and private lists", async ({ request }) => {
  const token = await getAccessToken(request, "buyer");
  const headers = { Authorization: `Bearer ${token}` };

  const meResponse = await request.get("/api/members/me", { headers });
  expect(
    meResponse.ok(),
    `Me API failed. status=${meResponse.status()} body=${await meResponse.text()}`,
  ).toBeTruthy();
  const meBody = await meResponse.json();
  expect(meBody.data.email).toBe("buyer@test.com");
  expect(meBody.data.nickname).toBe("buyer");

  const myProductsResponse = await request.get("/api/products/me?size=50", { headers });
  expect(
    myProductsResponse.ok(),
    `My products API failed. status=${myProductsResponse.status()} body=${await myProductsResponse.text()}`,
  ).toBeTruthy();
  const myProductsBody = await myProductsResponse.json();
  expect(myProductsBody.data.content.some((product: { title: string }) => product.title === "MacBook Pro 14 M3")).toBe(
    true,
  );

  const likesResponse = await request.get("/api/members/me/likes?size=50", { headers });
  expect(
    likesResponse.ok(),
    `My likes API failed. status=${likesResponse.status()} body=${await likesResponse.text()}`,
  ).toBeTruthy();
});
