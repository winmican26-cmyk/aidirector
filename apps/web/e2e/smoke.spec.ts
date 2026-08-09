import { expect, test } from "@playwright/test";

test("landing page loads in a real browser", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AI Director/i);
  await expect(page.getByRole("heading", { name: /Sports intelligence becomes cinema/i })).toBeVisible();
  await expect(page.getByText("Start free").first()).toBeVisible();
});

test("public legal pages are reachable", async ({ page }) => {
  for (const path of ["/terms", "/privacy"]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should respond successfully`).toBeLessThan(400);
  }
});
