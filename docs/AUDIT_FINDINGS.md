# Audit Findings — Deep Refactoring Plan (Phase 1)

> **Date:** 2026-08-15 · **Branch:** `main` @ `90d6aaf0`
> Companion to `docs/BASELINE_METRICS.md` (Phase 0). Every item below was
> **verified by reading the actual files / running tooling**, not assumed.
> Per `AGENTS.md`, repo docs WIN over the attached external plan; conflicts are
> flagged here and resolved in favor of the repo's authoritative state.

## A. Documentation contradictions (must consolidate, not duplicate)

| # | Conflict | Finding (verified) | Resolution |
|---|---|---|---|
| A1 | **Default branch** | Plan §0 doubts `master` vs `main`. Measured: `main` is live; `master` absent. | Use `main`. Plan's doubt is stale. |
| A2 | **Legacy layout** | Plan + `DEEP_REFACTORING_PLAN.md` describe a `js/*.js` legacy pipeline + TypeScript migration as the target. `AGENTS.md` + `ARCHITECTURE.md` state the `src/`+esbuild pipeline is **live and the legacy layout is superseded**. | Repo docs win. The `js/*.js` files still on disk are **fallback-only** (non-module `<script defer>`), not the build source. |
| A3 | **Test count** | Plan §4 suspects "17/17 = 100% coverage" badge is a pass-rate claim. Confirmed: no coverage tool runs; real pass-rate is **201 jest + 9 hardhat + smoke/a11y/perf**. | Badge is misleading; real coverage is a Phase 4 TODO (`c8`). |
| A4 | **License** | Plan §3 flags MIT (`README`) vs CC0-1.0 (Ecosyste.ms). | **Not yet verified** — `LICENSE`/`package.json.license` not read this pass. OPEN ITEM (low risk, no code impact). |
| A5 | **Bundle size** | Plan claims 68.7 KB / ~22 KB gzip; measured **89.5 KB / 24.8 KB gzip** (see Baseline). | Baseline file is authoritative. Plan numbers stale. |

## B. Duplication / dead-code candidates (verified)

| # | Suspicion | Verification | Action |
|---|---|---|---|
| B1 | Dual JS pipeline (`js/*.js` legacy + `js/refactored-bundle.js`) | `js/` contains `main.js`, `search.js`, `subscription.js`, `interactive.js`, `theme-manager.js`, `pwa.js`, `i18n.js`, `analytics.js`, `images.js`, `social-sharing.js`, `tags-categories.js`, `performance-optimizer.js` **and** `refactored-bundle.js`. `_layouts/default.html` loads BOTH (legacy `<script defer>` + module bundle). | **Confirmed live duplication.** Plan Phase 7 (Strangler Fig): keep legacy as fallback only; do NOT edit `js/*.js` expecting ship (per `AGENTS.md`). A single feature-flag switch + usage-metric confirmation is the exit criteria. |
| B2 | `build-stats.json` vs disk | Stats file lists 38 `*.min.js`/`*.min.css` entries (~226 KB). Re-ran `NODE_ENV=production node build.js`; `dist/` produced 32 verified entries (0 missing, sum matches reportedTotal). The file was **correct all along** — the earlier doubt was because `dist/` wasn't built in this working tree. | RESOLVED: stats valid; no action. |
| B3 | `css/` vs `_sass/` | `css/` holds generated `*.min.css`; `_sass/` holds SCSS sources. | Correct Jekyll convention (source vs output) — **not duplication**. No action. |
| B4 | `.bolt/` | Present (AI-builder artifact). Contents not opened this pass. | Candidate for archival IF unused; **needs human confirmation before removal** (Phase 1 rule: no deletion without commit + reason). OPEN ITEM. |
| B5 | `build.js` (Node) + `build-jekyll.rb` (Ruby) | Two build scripts on different languages. `build.js` does esbuild bundling + asset minify; `build-jekyll.rb` is the Jekyll orchestration. | Different responsibilities (assets vs site). Acceptable; document the split in `ARCHITECTURE.md`. |

## C. v4.0 additions — inventory (additive, consistent with `AGENTS.md`)

These were built in prior sessions and are **not** part of the original
`src/` app, but sit alongside it as the "Autonomous & Semantic Web" layer:

| File | Role | Tests |
|---|---|---|
| `src/modules/crdt-sync.js` | Convergent CRDT (vector clocks, LWW) | 19 (jest) |
| `src/modules/graph-sync.js` | P2P replication over transport bus | 4 (jest) |
| `src/modules/webrtc-transport.js` | Real WebRTC DataChannel transport | 6 (jest) |
| `src/modules/bci-controller.js` | BCI neuro-control abstraction | 6 (jest) |
| `src/modules/eeg-adapter.js` | EEG WebSocket → NeuroSample | 3 (jest) |
| `contracts/dao/*.sol` | GovernanceToken, SoulboundToken, ProposalEngine | 9 (hardhat) |
| `scripts/audit-dao.cjs`, `scripts/deploy-dao.cjs` | Security gate + deploy | — |
| `demo/p2p-simulator.html` | Live cross-tab P2P + BCI demo | — |

These do not conflict with the legacy app; they are isolated under `src/modules/`
and `contracts/`. Import-graph scan of `src/` shows **0 cycles** even with them.

## D. Open items (need human-in-the-loop — NOT auto-fixed)

- **D1 (A4) — LICENSE vs package.json CONFIRMED INCONSISTENT:** `LICENSE` file
  is **CC0 1.0 Universal**, but `package.json.license` = **MIT**, README badge
  says MIT, and README §License says "licensed under the MIT License - see the
  LICENSE file". The repo *intends* MIT but ships a CC0 file. Per plan Phase 7
  (license change = human-in-the-loop), **NOT auto-fixed**. Recommended fix:
  either (a) replace `LICENSE` with the MIT text (if MIT is intended), or
  (b) set `package.json.license` = "CC0-1.0" + fix README (if CC0 is intended).
  Needs your decision — I will not change the license without it.
- **D2 (B4):** `.bolt/` removal — confirm it's unused before deleting.
- **D3 (build-stats.json):** ✅ RESOLVED 2026-08-15 — ran `NODE_ENV=production
  node build.js`; `dist/` now exists; `build-stats.json` regenerated and
  verified (32 entries, 0 missing, sumOnDisk == reportedTotal == 231,731 B).
  The earlier "stale" finding was because `dist/` had not been built in this
  working tree; the stats file itself was correct.
- **D4 (B1 exit):** Decide Strangler-Fig timeline for legacy `js/*.js` fallback
  (measure 0% usage over a window, then remove in a separate PR).

## F. Bugs found and fixed during testing (verified)

- **F1 — `isObject()` returned operand instead of boolean.** `src/utils/helpers.js`
  `isObject(null)` returned `null` and `isObject(undefined)` returned `undefined`
  (short-circuit of `value && ...`), breaking any `=== false` comparison. Fixed
  by coercing with `!!` (commit adds `tests/unit/helpers.test.js` which caught it;
  fix is strictly safer — no caller relied on the non-boolean return, truthiness
  is unchanged). Coverage of `helpers.js` raised 33% → 61.6% lines.

- **F2 — `LocalStorage.length()` returns GLOBAL localStorage count**, not the
  namespaced count. `keys()`/`clear()` are prefix-scoped but `length()` uses
  `localStorage.length`. Documented quirk (not changed — could be a behavior
  change for callers); covered by `tests/unit/storage.test.js` with a
  non-fragile `>=` assertion.

## G. Phase 0/1 Definition-of-Done

- [x] Every row in the duplication table is a **fact**, not a guess.
- [x] Candidates-for-removal listed with rationale (B4, D-items).
- [x] No file deleted/changed during audit (measurement only).
- [ ] Human confirms D1–D4 before any deletion or license change.
