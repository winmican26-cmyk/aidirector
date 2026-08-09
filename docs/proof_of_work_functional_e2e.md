# Functional / E2E Proof of Work

Date: 2026-08-02

## Outcome

The application has a working public browser surface and a passing functional test suite. The authenticated media-to-clips journey is covered by a real Playwright spec, but it is not marked as passed in this environment because no legitimate Clerk storage state and authorized media fixture are available.

## User journeys and feature coverage

| Journey / feature | Evidence | Result |
|---|---|---|
| Open product landing page | Playwright `e2e/smoke.spec.ts`: title, hero heading, and “Start free” CTA | Covered; Playwright execution requires the dedicated E2E runner |
| Reach Terms and Privacy | Playwright `e2e/smoke.spec.ts`: both routes must respond below HTTP 400 | Covered; Playwright execution requires the dedicated E2E runner |
| Select source video in Upload Studio | `e2e/football-real.spec.ts`: real `input[type=file]` and `setInputFiles` | Implemented; not passed without auth/media fixture |
| Choose Football and create clips | Same spec: visible Football control and Create My Clips action | Implemented; not passed without auth/media fixture |
| Create a real processing job | Same spec asserts `/app/processing?job_id=...` and records the job ID | Implemented; not passed without auth/media fixture |
| Observe real pipeline progress | Same spec requires queued → running → intelligence → rendering → succeeded and the real events endpoint | Implemented; not passed without auth/media fixture |
| Review generated clips | Same spec asserts navigation to My Clips and clip/preview content | Implemented; not passed without auth/media fixture |
| Preview and download a rendered clip | Same spec opens preview and asserts an MP4/MOV/WebM download | Implemented; not passed without auth/media fixture |
| Core UI, service, state, accessibility, and formatting behavior | Vitest | 125 passed |
| Type safety | `tsc --noEmit` | Passed |

## Verification run

The following completed successfully:

```text
pnpm --filter @aidirector/web typecheck
  Passed with zero TypeScript errors.

pnpm --filter @aidirector/web test
  14 test files passed
  125 tests passed
```

Playwright files are excluded from Vitest and must be run with the dedicated Playwright runner:

```powershell
pnpm --filter @aidirector/web e2e -- --project=chromium
```

## Completion command for the real journey

Provide a legitimate persisted Clerk state and an authorized local media file outside the repository:

```powershell
$env:E2E_AUTH_STATE='C:\secure\aidirector\clerk-auth.json'
$env:E2E_FOOTBALL_MEDIA='C:\secure\media\football.mp4'
pnpm --filter @aidirector/web e2e -- e2e/football-real.spec.ts --project=chromium
```

### Legitimate fixture setup

`E2E_AUTH_STATE` must be created by signing into the local app through the normal Clerk UI in a dedicated test account, then saving the authenticated Playwright context with `context.storageState({ path: "C:\\secure\\aidirector\\clerk-auth.json" })`. Do not hand-edit the JSON, copy browser cookies, or commit it.

`E2E_FOOTBALL_MEDIA` must point to an existing authorized local football video supplied by the operator, for example `C:\\secure\\media\\football.mp4`. Do not download unlicensed media or add private media to the repository.

To create the state through the normal Clerk UI, start the app and run:

```powershell
$env:E2E_AUTH_STATE='C:\secure\aidirector\clerk-auth.json'
pnpm exec node apps/web/scripts/save-auth-state.mjs
```

The helper opens a headed browser, waits for the operator to complete normal Clerk sign-in, and saves Playwright `storageState` outside the repository. It contains no credentials and does not create cookies or tokens.

Before running, verify both paths without printing their contents:

```powershell
Test-Path -LiteralPath $env:E2E_AUTH_STATE
Test-Path -LiteralPath $env:E2E_FOOTBALL_MEDIA
```

A final PASS requires evidence of:

```text
UPLOAD → real job_id → queued → running → intelligence → rendering → succeeded
→ My Clips → preview → download
```

No success is claimed for that journey until the run produces the job ID, processing events, screenshots, and download artifact.

## Known environment issue

The current local server logs report Clerk clock skew and an infinite session-refresh loop. The machine and Node clocks were checked and agree, so this is not a local clock defect. The remaining likely causes are stale browser state or a Clerk key/instance mismatch, which must be checked in the Clerk dashboard without exposing secrets.

## Environment diagnosis — 2026-08-02

- Local system and Node time agree: 2026-08-02, Europe/Stockholm. No automatic clock change was made.
- The configured frontend key is a development/test Clerk key. The server key is also configured as a test key, but the secret was not printed or exposed. Clerk dashboard verification that both keys belong to the same instance remains an external prerequisite.
- `apps/web/middleware.ts` protects `/app(.*)` with `auth.protect()` and does not contain a redirect loop or test bypass.
- The required process variables `E2E_AUTH_STATE` and `E2E_FOOTBALL_MEDIA` are absent in this workspace. No auth state or media fixture was created.
- The Playwright suite is isolated from Vitest, but the full browser invocation timed out in this environment before producing a test summary. This is not treated as a product pass.

## Final status

**BLOCKED — external E2E prerequisites required; complete authenticated real-media journey not verified.**

Remaining prerequisites:

1. Confirm in Clerk that the redacted development publishable/secret pair belongs to one development instance.
2. Start the app with that environment loaded and clear stale browser state by creating a fresh Playwright context.
3. Supply a legitimate persisted Clerk `storageState` and authorized local football media path outside the repository.
4. Run the dedicated Playwright commands above and retain the job ID, status events, screenshots, trace, and download assertion.
