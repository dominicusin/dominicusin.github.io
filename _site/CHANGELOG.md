# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Project version (per `package.json`): **2.0.0**.

## [Unreleased]

### Added
- **Deep Refactoring Plan execution** (phases 0–4) baseline + audit artifacts:
  - `docs/BASELINE_METRICS.md` — reproducible measurements (lint/jest/hardhat/
    coverage/build), bundle size, dependency-graph (0 cycles).
  - `docs/AUDIT_FINDINGS.md` — verified doc contradictions + duplication table
    (dual JS pipeline, dead `embedding-cache.js`, stale `build-stats.json`).
  - `docs/adr/0001-module-layering.md` — ADR recording the verified acyclic,
    downward-dependency `src/` layering.
- **Real instrumented coverage gate** (plan Phase 4.2): `c8` added;
  `npm run test:coverage` replaced the old file-copy stub; a `coverage` job in
  `ci-cd.yml` enforces a no-regression floor (lines ≥35 / branches ≥62).
- **Unit test suites added** (plan Phase 4.1) raising real coverage:
  - `tests/unit/helpers.test.js` (30) — pure utils incl. fallback branches.
  - `tests/unit/storage.test.js` (13) — incl. localStorage→in-memory fallback.
  - `tests/unit/vector-store.test.js` (10, un-quarantined) — IDB + in-memory.
  - `tests/unit/analytics-service.test.js` (51) — ratings, sampling, flush/retry.
  - `tests/unit/prefetch.test.js` (16) — Vector D predictive prefetch.
  - `tests/unit/embedding-cache-service.test.js` (15) — LRU + TTL.
  - `tests/unit/vector-search.test.js` (13) — TF-IDF semantic search.
- **v4.0 "Autonomous & Semantic Web" layer** (additive): CRDT sync, P2P graph
  replication over WebRTC DataChannel, DAO smart contracts (Solidity/OZ5) with
  Hardhat tests, BCI neuro-control + EEG adapter, live P2P demo, static DAO
  security audit script. (See prior commit history `01e7d7b7`+.)

### Fixed
- `src/utils/helpers.js` `isObject(null|undefined)` returned the operand
  (`null`/`undefined`) instead of `false` — now coerced with `!!` (caught by
  the new `helpers.test.js`).
- `docs/LICENSE` changed from CC0 1.0 to **MIT** to match `package.json`,
  README badge, and README §License (user decision 2026-08-15).

### Changed
- `build-stats.json` regenerated via `NODE_ENV=production node build.js`
  (verified: 32 entries, sum on disk == reported total == 231,731 B).
- `jest.config.js` — `vector-store.test.js` removed from the quarantine list
  (now a green, passing suite).

### Known issues / open items (human-gated)
- **Dead code**: `src/services/embedding-cache.js` (v3.0, 561 LOC) is imported
  by no module — superseded by `embedding-cache-service.js`. Candidate for
  archival once confirmed unused (Phase 7 deletion requires human confirmation).
- **Legacy dual pipeline**: `js/*.js` (non-module `<script defer>`) still ships
  alongside `js/refactored-bundle.js`. Strangler-Fig exit requires a usage
  measurement window before removal.
- **Coverage gap**: measured branch coverage ~63% (line ~37%). The §11 target
  of ≥85% branch requires the Phase 4.4 Playwright E2E layer to cover the
  large DOM/network-bound services (rum, pwa, vr-export, image-optimizer,
  social-sharing, assistant-ui, ai-i18n, link-repair-agent) — not yet built.

## [2.0.0]
- Initial published version per `package.json` at the start of this work.
  (No detailed prior changelog was maintained; this file bootstraps it.)
