import { expect, test } from "@playwright/test";
import fs from "node:fs";

const authState = process.env.E2E_AUTH_STATE;
const mediaPath = process.env.E2E_FOOTBALL_MEDIA ?? "E:\\Download Folder August 6 2026\\E2E Test\\Rosenborg v Man Utd _ Extended Highlights.mp4";

test.describe("authenticated non-payment workflows", () => {
  test.skip(!authState, "Set E2E_AUTH_STATE to a legitimate persisted Clerk browser state.");

  test("upload screen exposes the complete creator workflow", async ({ page }) => {
    test.skip(!fs.existsSync(mediaPath), "Real football media is unavailable.");
    await page.goto("/app/upload");
    await expect(page.getByRole("heading", { name: /Turn one video into professional clips/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create My Clips/i })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
    await page.locator('input[type="file"]').setInputFiles(mediaPath);
    await expect(page.getByText("Rosenborg v Man Utd _ Extended Highlights.mp4", { exact: true })).toBeVisible();
  });

  test("mobile navigation exposes every non-payment destination", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("aidirector_onboarding_dismissed", "true"));
    await page.goto("/app/upload");
    await page.waitForTimeout(800);
    await page.evaluate(() => localStorage.setItem("aidirector_onboarding_dismissed", "true"));
    await page.reload();
    const skipTutorial = page.getByText("Skip tutorial", { exact: true });
    if (await skipTutorial.count()) {
      await skipTutorial.click({ force: true });
    }
    await page.getByRole("button", { name: "Open navigation" }).click();
    const navigation = page.getByRole("dialog", { name: "App navigation" });
    await expect(navigation).toBeVisible();
    for (const label of ["New Clip", "Pipelines", "My Clips", "Director Review", "Render Center", "Brief Templates", "Performance", "Settings"]) {
      await expect(navigation.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
  });
});
