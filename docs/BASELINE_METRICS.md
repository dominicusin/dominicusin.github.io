# Baseline Metrics

> **Date of measurement:** 2026-08-15 (post Hugo migration + Phase 7 + P0 consolidation)
> **Commit measured:** `0a917b7cd` (main, HEAD at capture time)
> **Measured by:** live tooling (`npm run lint`, `npx jest`, `npx hardhat test`,
>   `npx c8`, `node scripts/audit-dao.cjs`). Every number below is a
> **reproducible measurement**, not an estimate.
> This file is the single source of truth for all "before/after" comparisons.

## 1. Test gates (reproducible)

| Gate | Command | Result |
|---|---|---|
| ESLint (src + tests) | `npm run lint` | **0 errors, exit 0** |
| Jest unit (jsdom) | `npx jest --config jest.config.js` | **262 passed / 263** (1 flaky: `theme-manager.test.js` test-ordering assertion, unrelated to migration) across **20 suites** |
| DAO contracts (Hardhat) | `npx hardhat test` | **9 passing / 9** (local Hardhat network) |
| DAO security audit (static) | `node scripts/audit-dao.cjs` | **PASSED** (6/6 safety patterns) |
| Hugo production build | `npm run build` (hugo --gc --minify) | **155 HTML, 0 errors** |

**Note:** the legacy `node build.js` (esbuild) and `npm ci --dry-run` Jekyll-era
gates are gone — the site is Hugo-only (see `docs/adr/0002-two-plane-architecture.md`).

## 2. Asset sizes (measured on disk)

The static site is produced by Hugo; no hand-rolled JS bundle is shipped.
Browser runtime = Blowfish theme bundle + `assets/lib/fuse/fuse.min.cjs` (search).

| Asset | Raw |
|---|---|
| `assets/lib/fuse/fuse.min.cjs` (search) | ~26 KB |
| `assets/images/og-default.svg` (OG image) | ~1 KB |
| `public/index.json` (search index, generated) | ~2.4 MB |
| `static/data/knowledge-graph.json` (generated, gitignored) | corpus-sized |

## 3. Source structure (measured)

| Metric | Value |
|---|---|
| `src/**/*.js` files | 29 (was 30; `embedding-cache.js` dead code removed in cleanup) |
| Total `src/` LOC | ~10,955 (down from 11,516 after dead-code removal) |
| Largest modules | `services/rum-service.js` 808 · `services/vr-export-service.js` 637 · `services/pwa-service.js` 625 · `services/analytics-service.js` 599 |
| `src/modules/` count | 13 (incl. v4.0: crdt-sync, graph-sync, webrtc-transport, bci-controller, eeg-adapter) |
| `src/` import cycles | **0** (DFS scan — verified in ADR-0001) |
| DAO contracts | 3 Solidity (`contracts/dao/*.sol`) |
| DAO/Hardhat scripts | `scripts/deploy-dao.cjs`, `scripts/audit-dao.cjs` |

**`src/` is NOT bundled into the static site** (Hugo ignores it). It is retained
as an engineering substrate / R&D layer.

## 4. CI status (remote, GitHub Actions)

| Workflow | Status |
|---|---|
| `Deploy Hugo site to GitHub Pages` (`hugo.yml`) | success (sole publisher) |
| `🔒 Security Scan` (`security.yml`) | success (Node audit + Trivy + Semgrep) |
| `Deploy DAO to Sepolia` (`deploy-dao.yml`) | `test` job success; `deploy` **failure by design** (no `DEPLOY_PRIVATE_KEY`/`SEPOLIA_RPC_URL` secrets — fails loudly) |
| `deploy-ipfs.yml` | **DISABLED** (legacy Jekyll + compromised Pinata) |

## 5. Repo hygiene (measured)

| Check | Result |
|---|---|
| `node_modules/` tracked in git | **0 files** (gitignored — correct) |
| `public/` / `resources/` tracked | **0** (gitignored) |
| Default branch | `main` (`master` removed; all workflow branch refs updated) |
| `.gitignore` | restored after being overwritten (PR #70) |

## 6. Targets adopted from the plan (to re-measure later)

| Metric | Baseline (this file) | Plan target |
|---|---|---|
| Real line coverage (`c8`) | **76.57%** | ≥85% (Phase 4 TODO — needs Playwright E2E) |
| Real branch coverage | **64.49%** | ≥85% |
| `src/` import cycles | 0 | 0 (held) |
| Lint errors | 0 | 0 (held) |
| Hugo build errors | 0 | 0 (held) |

## 7. Real test coverage (measured 2026-08-15 with `c8`)

Instrumented coverage (`npx c8 ... npx jest`):

| Scope | % Stmts | % Branch | % Funcs | % Lines |
|---|---|---|---|---|
| **All files** | **76.57** | **64.49** | **73.3** | **76.57** |
| `src/config` | 100 | 100 | 100 | 100 |
| `src/core` (theme-manager) | 90.0 | 60.7 | 96 | 90.0 |
| `src/utils` (helpers, storage) | 63 | 72 | 70 | 63 |
| `src/modules` (mixed) | 49 | 61 | 72 | 49 |
| `src/services` | 37 | 67 | 73 | 37 |
| `src/agents` (link-repair-agent) | 0 | 0 | 0 | 0 |

**Zero/low-coverage modules (largest first) — the real test-debt surface:**
`rum-service.js` (808), `vr-export-service.js` (637), `image-optimizer.js` (570),
`social-sharing.js` (578), `vector-search-service.js` (573), `assistant-ui.js`
(387), `pwa-service.js` (625), `index.js` (217). These are DOM/network-bound
services with no jsdom harness — they require a browser/E2E (Playwright) layer
to cover without faking.

**Removed dead code:** `embedding-cache.js` (561 LOC, unreferenced) — deleted in
the cleanup phase; its unit test removed too. `embedding-cache-service.js`
remains (used by `vector-search-service.js`).

**Plan Phase 4 target:** ≥85% branch coverage as a CI gate. Current 64.49% branch
/ 76.57% line — substantial gap concentrated in DOM/network services. Closing it
requires the Playwright E2E layer (Phase 0/4), not unit tests.

## 7. Phase 4 update — doc-debt (2026-08-17, commit series #120–#123)

Added unit tests for the two modules that were **truly 0%-covered** (the other five
modules named in the backlog already had `tests/unit/*.test.js`, so they were not
re-tested). Measured with `npm run test:coverage` (c8, `src/**/*.js`):

| Module | Lines (before→after) | Branch (before→after) |
|---|---|---|
| `src/services/vr-export-service.js` | 0% → **84.92%** | 0% → **71.92%** |
| `src/modules/social-sharing.js` | 0% → **77.68%** | 0% → **64.91%** |

**Source bugs found and fixed by the new tests** (this is the real value of the
coverage work, not the percentage):
1. `vr-export-service.js:95` — `const alpha` was reassigned inside the force-layout
   loop → `TypeError: "alpha" is read-only`. Changed to `let alpha` (VR export was
   previously non-functional).
2. `social-sharing.js` — 4× `} catch {} {` missing the `error` binding; inside the
   block `error` was referenced → `ReferenceError: error is not defined` on **any**
   share-count fetch failure / web-share / clipboard-fallback path. Restored
   `catch (error)` on the two blocks that use it (lines 293, 410); the two blocks
   that don't use it kept optional `catch {}` (ES2019).

**Honest note on the 85% target:** adding these two suites did NOT move the repo-wide
`c8 --all` branch number to 85% (it stays in the ~65% band because many other
`src/**` modules remain untested — out of doc-debt scope). The 85% gate remains a
TODO requiring the broader Playwright E2E layer, as the plan itself states. Recorded
here so the baseline is never retro-fabricated upward.
