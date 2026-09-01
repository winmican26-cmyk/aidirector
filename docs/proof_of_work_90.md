# Proof of Work — Stabilization pass toward 90%

**Date:** 2026-09-01
**Branch:** `main`
**HEAD at verification:** `c3a4dd1`
**Baseline before this pass:** `6d1135a` ("Harden media pipeline and add UX E2E coverage")

This pass landed the uncommitted hardening batch that was sitting in the
working tree, fixed one real backend bug found while reviewing it, closed a
test-coverage gap, added an E2E job to CI, and re-verified every gate that
can be checked without operator-supplied credentials or media.

---

## What changed

| Commit | Summary |
|---|---|
| `22ddbf4` | **fix(api)** — `state_transitions._publish_event` was passed the undefined name `to_state` instead of the `to` parameter, so every WebSocket job event raised `NameError` inside the "best-effort" wrapper and **no transition event was ever published**. Also: `brief_templates` DELETE returns an explicit bodyless `Response` (204), `test_migrations` resolves `alembic.ini` relative to the file (cwd-independent), `docker-compose` uses the `postgresql+psycopg://` URL scheme the engine expects. |
| `5e74cc8` | **feat(web)** — 62 files. `clips` and `processing` screens now render the live `JobView` composite (`useRecentJobs` + `useJobView`, mapped by the new pure `map-job-view` module) instead of `MOCK_CLIPS`/`MOCK_PROJECT`; real download via `GET /api/exports/{id}/url` → fetch→blob→anchor with new-tab fallback; `processing` drives status from `PollingTransport` job events and stops on terminal states instead of a simulated clock. API client: 10s `AbortController` timeout + network-error → `ApiError(0, …)`. Analytics: send-and-prune so delivered events never re-send. `MobileNav` slide-in drawer mounted in `TopBar`. CSP `connect-src` allows R2 + the configured API origin. Design-system refresh to accent-blue + semantic status tokens. Playwright dev-dep + `e2e` scripts; e2e specs excluded from Vitest. |
| `9b29f0a` | **chore** — `.gitignore` for `apps/web/test-results/`, Playwright report dirs, and `aidirector_*probe*.db`; fixed a dangling sentence left in `README.md` by an earlier deletion; appended two verification-attempt records to `proof_of_work_phase3_4.md`. |
| `c3a4dd1` | **test(api)** — 16 cases for `apply_feedback_to_rank_score` (trust-gradient rank feedback): null-view / below-confidence / neutral no-ops, ±0.15 cap both directions, proportional confidence scaling, `[0,1]` clamp, determinism, metadata passthrough. The function had zero coverage. |
| *(uncommitted in this doc's commit)* | **ci** — new `e2e-smoke` job runs `playwright test e2e/smoke.spec.ts` on every push/PR; uploads traces on failure. |

---

## Verification — commands and results

All run on Windows 11, Python 3.12 (`.venv`), Node 20 / pnpm 9, at `c3a4dd1`.

### API unit tests
```
$ cd apps/api && python -m pytest -q
190 passed, 10 skipped, 3 warnings in 39.83s
```
The 10 skips are `integration`-marked (`test_render_pipeline.py`,
`test_podcast_pipeline.py`) and require `SOURCE_VIDEO` — see "Not verified".

### New trust-gradient test
```
$ python -m pytest tests/unit/test_ranking_feedback_adapter.py -q
16 passed in 1.04s
```

### Web unit tests
```
$ cd apps/web && pnpm test        # vitest run
Test Files  16 passed (16)
     Tests  142 passed (142)
```

### Web type-check
```
$ pnpm typecheck                  # tsc --noEmit
exit 0
```

### Production build
```
$ pnpm build                      # next build 15.5.18
 ✓ Compiled successfully in 76s
 ✓ Generating static pages (6/6)
exit 0 — 19 routes emitted, no type errors
```

### Smoke E2E (real browser)
```
$ pnpm exec playwright test e2e/smoke.spec.ts --project=chromium
  ok 1 [chromium] › landing page loads in a real browser (10.3s)
  ok 2 [chromium] › public legal pages are reachable (19.5s)
  2 passed (1.0m)
```

---

## Not verified — needs operator input

| Gate | Blocker |
|---|---|
| `authenticated-workflows.spec.ts`, `football-real.spec.ts` | `test.skip` unless `E2E_AUTH_STATE` points to a persisted Clerk browser session. |
| `test_render_pipeline.py` (upload → scene analysis → director plan → render → export) | `integration`-marked; skips unless `SOURCE_VIDEO` points to a real match file with `ffmpeg`/`ffprobe` on `PATH`. |
| Live Modal deploy + real R2 bucket/IAM | Credentials + `modal deploy`; no live infra provided. |
| Stripe metered billing | Meters must be created in the Stripe dashboard; `STRIPE_METER_*` IDs then wired in. |
| Social publishing OAuth (YouTube / TikTok / Instagram) | Per-platform app registration. |
| Lighthouse thresholds | CI `lighthouse` job is `continue-on-error`; no `.lighthouserc` asserting Perf/A11y budgets yet. |

## Repo-hygiene notes (left for the owner)

- Untracked non-project files at the repo root (`create_micany_*.py`,
  `create_selected_cafe_graphics.py`, `export_lilla_fika_pngs.py`,
  `sample-inspect/`, …) — not part of AI Director; not staged, not deleted.
- `packages/intel` submodule has a dirty working tree (modified
  `frontend/package.json` + `package-lock.json`, several deleted
  `frontend/tests/*` and `frontend/ui_test*.js` files). The recorded
  submodule commit still matches the superproject pointer; the deletions
  were not made in this pass and were not committed.
- A stale `stash@{0}` ("WIP on main: 05c9d42") predates current `HEAD`.
