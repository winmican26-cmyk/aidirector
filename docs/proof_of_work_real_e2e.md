# Real Football E2E proof of work

## Current status

The real Football E2E has **not** been run to completion in this workspace because the connected Codex Chrome automation backend rejects local file attachment with `Not allowed` for both the authorized MP4 and a harmless control file.

No product source was changed, no upload API was called directly, no job was fabricated, and no success is claimed.

## Infrastructure delivered

- Added `apps/web/e2e/football-real.spec.ts`.
- The test uses the real `/app/upload` UI and Playwright `setInputFiles` on the actual file input.
- It requires legitimate persisted Clerk state through `E2E_AUTH_STATE`.
- It records the real `job_id`, `/api/jobs/{job_id}/events` traffic, status milestones, console errors, failed requests, screenshots, and download output.
- It fails if the job ID, event endpoint, processing milestones, clips, preview, or download are missing.
- It explicitly rejects evidence of the old `180000` synthetic timing path.

## Required completion evidence

The report can be marked PASS only after a Playwright Chromium run records:

`UPLOAD → real job_id → queued → running → intelligence → rendering → succeeded → My Clips → preview → download`

Until that run is executed in a file-capable browser environment:

- Browser infrastructure: Codex Chrome file attachment blocked
- Application upload: NOT VERIFIED
- Football: NOT VERIFIED
- Basketball: NOT VERIFIED
- Podcast: NOT VERIFIED
