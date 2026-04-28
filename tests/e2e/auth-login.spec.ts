import { test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("buyer test account can log in", async ({ page }) => {
  await loginAs(page, "buyer");
});
