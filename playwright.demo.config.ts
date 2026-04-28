import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 5173);
const host = process.env.E2E_HOST ?? "localhost";
const baseURL = process.env.E2E_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  globalTimeout: 300_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  forceExit: true,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on",
    screenshot: "only-on-failure",
    video: {
      mode: "on",
      size: { width: 1600, height: 900 },
    },
    headless: false,
    launchOptions: {
      slowMo: 450,
    },
    viewport: { width: 1600, height: 900 },
  },
  webServer: {
    command: `pnpm dev --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
