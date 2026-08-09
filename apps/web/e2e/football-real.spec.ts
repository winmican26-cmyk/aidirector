import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const mediaPath = process.env.E2E_FOOTBALL_MEDIA ?? "E:\\Download Folder August 6 2026\\E2E Test\\Rosenborg v Man Utd _ Extended Highlights.mp4";
const authState = process.env.E2E_AUTH_STATE;

test.describe("real Football upload pipeline", () => {
  test.skip(!authState, "Set E2E_AUTH_STATE to a legitimate persisted Clerk browser state.");

  test("uploads authorized media and verifies the real job pipeline", async ({ page }, testInfo) => {
    test.skip(!fs.existsSync(mediaPath), `Authorized media not found: ${mediaPath}`);

    const transitions: string[] = [];
    const networkFailures: string[] = [];
    const apiRequests: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") testInfo.attach("console-error", { body: message.text(), contentType: "text/plain" });
    });
    page.on("requestfailed", (request) => networkFailures.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`));
    page.on("request", (request) => {
      if (request.url().includes("/api/")) apiRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto("/app/upload");
    await expect(page.getByRole("heading", { name: /Turn one video into professional clips/i })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("01-upload-screen.png"), fullPage: true });

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
    await fileInput.setInputFiles(mediaPath);
    transitions.push("file-selected");
    await expect(page.getByText(path.basename(mediaPath), { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("02-file-selected.png"), fullPage: true });

    await page.getByRole("button", { name: "Football", exact: true }).click();
    await page.getByRole("button", { name: "Create My Clips", exact: true }).click();
    transitions.push("create-clicked");

    await expect.poll(() => page.url(), { timeout: 120_000 }).toMatch(/\/app\/processing\?job_id=.+/);
    const jobId = new URL(page.url()).searchParams.get("job_id");
    expect(jobId, "real job_id must be present in the processing URL").toBeTruthy();
    transitions.push(`job-created:${jobId}`);
    await testInfo.attach("job-id", { body: jobId!, contentType: "text/plain" });
    await page.screenshot({ path: testInfo.outputPath("03-processing-started.png"), fullPage: true });

    const observedStatuses = new Set<string>();
    await expect.poll(async () => {
      const body = await page.locator("body").innerText();
      for (const status of ["queued", "running", "intelligence", "rendering", "succeeded"]) {
        if (body.toLowerCase().includes(status)) observedStatuses.add(status);
      }
      return body.toLowerCase().includes("succeeded");
    }, { timeout: Number(process.env.E2E_PROCESSING_TIMEOUT_MS ?? 900_000), intervals: [2_000, 5_000, 10_000] }).toBeTruthy();

    for (const status of ["queued", "running", "intelligence", "rendering", "succeeded"]) {
      expect(observedStatuses, `expected real processing status: ${status}`).toContain(status);
      transitions.push(status);
    }
    expect(apiRequests.some((request) => request.includes(`/api/jobs/${jobId}/events`)), "Processing must use the real job events endpoint").toBeTruthy();
    expect(apiRequests.some((request) => request.includes("180000")), "old synthetic 180-second simulation must not be used").toBeFalsy();
    await page.screenshot({ path: testInfo.outputPath("04-processing-succeeded.png"), fullPage: true });

    await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/app\/clips/);
    transitions.push("my-clips");
    await expect(page.getByRole("main")).toContainText(/clip|download|preview/i);
    await page.screenshot({ path: testInfo.outputPath("05-my-clips.png"), fullPage: true });

    const preview = page.getByRole("button", { name: /preview|play/i }).first();
    if (await preview.count()) {
      await preview.click();
      transitions.push("preview");
    } else {
      const video = page.locator("video");
      await expect(video).toHaveCount(1);
      transitions.push("preview");
    }

    const download = page.getByRole("link", { name: /download/i }).first();
    await expect(download).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await download.click();
    const artifact = await downloadPromise;
    expect(artifact.suggestedFilename()).toMatch(/\.(mp4|mov|webm)$/i);
    transitions.push("download");

    await testInfo.attach("transitions", { body: transitions.join("\n"), contentType: "text/plain" });
    await testInfo.attach("api-requests", { body: apiRequests.join("\n"), contentType: "text/plain" });
    await testInfo.attach("network-failures", { body: networkFailures.join("\n"), contentType: "text/plain" });
  });
});
