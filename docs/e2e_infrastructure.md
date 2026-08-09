# Real E2E browser infrastructure

This repository uses Playwright with a dedicated Chromium project for local-file E2E. It does not depend on the native Windows file picker and does not call upload APIs directly.

## Why the Codex Chrome session is not suitable

The Codex Chrome extension backend can open the real `input[type="file"]`, but its `filechooser.setFiles(...)` operation returns `{"code":-32000,"message":"Not allowed"}` for both the authorized Football MP4 and a harmless `package.json`. The failure occurs before the application receives a file, so it is a browser automation limitation, not an AI Director upload result. Chrome 151 and the authenticated `micany05` profile were verified. No separate `chrome-devtools-mcp` backend is exposed in this environment.

## Install and run

From the repository root:

```powershell
pnpm install
pnpm exec playwright install chromium
```

Create a legitimate authenticated Playwright state through the normal Clerk flow. Do not commit the state file or credentials. Save it outside Git and point the test at it:

```powershell
$env:E2E_AUTH_STATE='C:\secure\aidirector\clerk-auth.json'
$env:E2E_FOOTBALL_MEDIA='C:\Users\mican\Downloads\E2E Test\Rosenborg v Man Utd _ Extended Highlights.mp4'
pnpm --filter @aidirector/web e2e -- e2e/football-real.spec.ts --project=chromium
```

The test attaches the authorized media with Playwright `page.locator('input[type="file"]').setInputFiles(...)`, then drives the visible Upload Studio controls. It records screenshots, console errors, failed requests, API requests, the real job ID, transitions, and the download artifact under Playwright test results.

## Authentication

Use a dedicated Clerk test account or a manually authenticated browser context saved with Playwright `storageState`. Keep credentials and state files outside the repository. The test skips when `E2E_AUTH_STATE` is absent so an unauthenticated run cannot be mistaken for a product failure.

## Additional media

Basketball and Podcast runs require separately authorized local media. Set the corresponding media path in a separate test configuration only after the file is available. Do not download or add unlicensed fixtures.

## Troubleshooting

- `ENOENT`: verify the media path and read access.
- Clerk redirect: regenerate the persisted authenticated state through the normal UI flow.
- `setInputFiles` failure: verify the test is running under Playwright Chromium, not the Codex extension backend.
- Missing job ID or event request: the test fails before claiming pipeline success.
- Trace/screenshots: inspect the Playwright result directory; use `--trace on` for a full trace on a diagnostic run.
