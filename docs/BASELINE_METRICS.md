# Baseline Metrics — Deep Refactoring Plan (Phase 0)

> **Date of measurement:** 2026-08-15
> **Commit measured:** `90d6aaf0` (main, HEAD at capture time)
> **Measured by:** live tooling (`npm run lint`, `npx jest`, `npx hardhat test`,
>   `node build.js`, `node scripts/audit-dao.cjs`, `node tests/run-tests.js`).
> Every number below is a **reproducible measurement**, not an estimate.
> This file is the single source of truth for all "before/after" comparisons
> in later phases.

## 1. Test gates (reproducible)

| Gate | Command | Result |
|---|---|---|
| ESLint (src + tests) | `npm run lint` | **0 errors, exit 0** |
| Jest unit (jsdom) | `npx jest --config jest.config.js` | **201 passed / 201** across **16 suites** |
| Smoke + a11y + perf | `node tests/run-tests.js` | Unit + Accessibility + Performance gates **pass** |
| DAO contracts (Hardhat) | `npx hardhat test` | **9 passing / 9** (local Hardhat network) |
| DAO security audit (static) | `node scripts/audit-dao.cjs` | **PASSED** (6/6 safety patterns) |
| Production build | `NODE_ENV=production node build.js` | **validation passed**; bundles `src/` → `js/refactored-bundle.js` |

**Note (test count vs plan):** the plan's Phase 4 expressed suspicion that the
"17/17 tests = 100% coverage" badge was a pass-rate claim, not real coverage.
Confirmed: coverage is NOT currently measured by a coverage tool — there is no
`c8`/`istanbul` gate. The credible figure today is **pass-rate**: 201 jest unit
+ 9 hardhat + smoke/a11y/perf. A real `c8` branch-coverage measurement is a
TODO for Phase 4, not a present capability.

## 2. Bundle / asset sizes (measured on disk)

| Asset | Raw | Gzipped |
|---|---|---|
| `js/refactored-bundle.js` (esbuild, primary module bundle) | **89,484 B (89.5 KB)** | **24,784 B (24.8 KB)** |
| Legacy `js/main.js` (non-module, still shipped) | 8,901 B | — |
| Legacy `js/search.js` | 9,557 B | — |
| Legacy `js/subscription.js` | 10,278 B | — |
| Legacy `js/interactive.js` | 10,739 B | — |
| `css/main.min.css` (per build-stats) | 12,412 B | — |

`build-stats.json` (last written 2026-08-14T21:46Z) reports `totalSize: 231,731 B`
(~226 KB) across 38 css/js entries, but **those `*.min.js`/`*.min.css` files are
NOT present on disk** — `build-stats.json` is stale/inconsistent with the tree.
See `docs/AUDIT_FINDINGS.md` §D.

**The plan's own baseline table claimed** `refactored-bundle.js` = 68.7 KB /
~22 KB gzip and "Total production bundle ~217 KB". Measured reality: the bundle
is **89.5 KB raw / 24.8 KB gzip**. The plan's numbers are out of date; this
file supersedes them as the verified baseline.

## 3. Source structure (measured)

| Metric | Value |
|---|---|
| `src/**/*.js` files | 30 |
| Total `src/` LOC | 11,516 |
| Largest modules | `services/rum-service.js` 808 · `modules/search-engine.js` 665 · `services/vr-export-service.js` 637 · `services/pwa-service.js` 625 · `services/analytics-service.js` 599 |
| `src/modules/` count | 13 (incl. v4.0: crdt-sync, graph-sync, webrtc-transport, bci-controller, eeg-adapter) |
| `src/` import cycles | **0** (DFS scan over relative imports — no circular deps) |
| DAO contracts | 3 Solidity (`contracts/dao/*.sol`) |
| DAO/Hardhat scripts | `scripts/deploy-dao.cjs`, `scripts/audit-dao.cjs` |

## 4. CI status (remote, GitHub Actions)

| Workflow | Status at `90d6aaf0` |
|---|---|
| `CI/CD Pipeline` | success |
| `Deploy Jekyll site to Pages` | success |
| `🔒 Security Scan` | success |
| `Deploy DAO to Sepolia` | **failure by design** (no `DEPLOY_PRIVATE_KEY`/`SEPOLIA_RPC_URL` secrets — fails loudly, no fake deploy) |

## 5. Repo hygiene (measured)

| Check | Result |
|---|---|
| `node_modules/` tracked in git | **0 files** (gitignored — correct) |
| Default branch | `main` (the plan's §0 doubt about `master` is resolved: `main` is live) |
| `npm ci --dry-run` | exit 0 (lockfile in sync) |

## 6. Definition-of-Done checklist (Phase 0)

- [x] `docs/BASELINE_METRICS.md` created with reproducible numbers (not estimates).
- [x] `docs/AUDIT_FINDINGS.md` enumerates doc contradictions + duplication findings.
- [x] No application code changed during Phase 0 (measurement only).

## 7. Targets adopted from the plan (to re-measure later)

| Metric | Baseline (this file) | Plan target |
|---|---|---|
| Bundle raw size | 89.5 KB | <25 KB (plan §5/§DEEP) — **not met**; needs code-splitting (Phase 5) |
| Gzip bundle | 24.8 KB | ~20 KB |
| Real branch coverage | **62.18%** (measured, §8) | ≥85% (Phase 4 TODO) |
| `src/` import cycles | 0 | 0 (held) |
| Lint errors | 0 | 0 (held) |

## 8. Real test coverage (measured 2026-08-15 with `c8`)

> Previously the README/badge implied "100% coverage". Verified: that was a
> **pass-rate** claim. Instrumented coverage (`npm run test:coverage`) shows:

| Scope | % Stmts | % Branch | % Funcs | % Lines |
|---|---|---|---|---|
| **All files** | **34.95** | **62.18** | **70.31** | **34.95** |
| `src/config` | 100 | 100 | 100 | 100 |
| `src/core` (theme-manager) | 90.0 | 60.7 | 96 | 90.0 |
| `src/utils` (helpers, storage) | 56.7 | 62.0 | 53.8 | 56.7 |
| `src/modules` (mixed) | 48.7 | 60.7 | 71.9 | 48.7 |
| `src/services` | 17.6 | 66.2 | 69.2 | 17.6 |
| `src/agents` (link-repair-agent) | 0 | 0 | 0 | 0 |

**Zero-coverage modules (largest first) — the real test-debt surface:**
`rum-service.js` (808), `vr-export-service.js` (637), `image-optimizer.js`
(570), `social-sharing.js` (578), `vector-search-service.js` (573),
`ai-i18n-service.js` (328), `embedding-cache.js` (561), `assistant-ui.js`
(387), `pwa-service.js` (625), `vector-store.js` (137), `index.js` (217),
`link-repair-agent.js` (414).

**v4.0 modules (already covered):** bci-controller 91.8%, eeg-adapter 91.9%,
crdt-sync 60.4%, graph-sync 51.6%, webrtc-transport 47.7%.

**Plan Phase 4 target:** ≥85% branch coverage as a CI gate. Current 62.18%
branch / 34.95% line — substantial gap. Raising the zero-coverage services
(analytics, pwa, rum, vector-search, embedding-cache) is the highest-leverage
next step.

