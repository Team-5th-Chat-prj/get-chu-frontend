import { promises as fs } from "node:fs";
import path from "node:path";
import type { DemoAccount } from "./demo";

export type DemoJourneyState = {
  account: DemoAccount;
  productId: number;
  productTitle: string;
  ownerAccount: "buyer" | "seller";
  ownerMemberId: number;
};

const DEMO_STATE_PATH = path.resolve(process.cwd(), "tests/e2e/.demo-state.json");

export async function saveDemoJourneyState(state: DemoJourneyState) {
  await fs.writeFile(DEMO_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function loadDemoJourneyState() {
  const raw = await fs.readFile(DEMO_STATE_PATH, "utf8");
  return JSON.parse(raw) as DemoJourneyState;
}

export async function clearDemoJourneyState() {
  await fs.rm(DEMO_STATE_PATH, { force: true });
}
