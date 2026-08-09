import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const statePath = process.env.E2E_AUTH_STATE;
if (!statePath) {
  throw new Error("Set E2E_AUTH_STATE to an absolute path outside the repository.");
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });

const rl = readline.createInterface({ input, output });
await rl.question("Sign in normally through Clerk in the opened browser, then press Enter here: ");
await rl.close();

await fs.mkdir(path.dirname(path.resolve(statePath)), { recursive: true });
await context.storageState({ path: path.resolve(statePath) });
await browser.close();
console.log(`Saved authenticated Playwright state to ${path.resolve(statePath)}`);
