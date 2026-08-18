# Roadmap — `dominicusin.github.io`

Single source of truth for execution planning. Task graph lives in `.beads/beads.json`.
Requirements/initiatives live in `.planning/initiatives/`. Architecture decisions in
`docs/architecture/ADR-*.md`. This file is the human-readable index.

> **Status (2026-08-18, cycles 26–38 merged):** Phases 0–1 + most of 2–4 are DONE.
> Remaining blockers are GATE-2 user-confirmation items (see below).

## Phases

- **Phase 0 — Baseline (DONE)**: `docs/architecture/AUDIT-2026-08.md` records verified
  current state. Planning dirs consolidated: `.planning/` = requirements SoT,
  `.beads/` = live task graph; `.gsd`/`.openspec`/`.specify` archived to `docs/archive/`.
- **Phase 1 — Consolidation (DONE)**: R&D CI isolated (`test-rnd.yml`, Cycle 28);
  planning SoT documented (Cycle 27). `AGENTS.md` update (T93) is **blocked** — the
  file is a protected agent-instruction file requiring explicit user approval.
- **Phase 2 — Reliability (DONE)**: search index verified full via `public/index.json`
  (384 entries, 4.35 MB); dead root `search.json` removed (Cycle 29); R&D search code
  repointed to `/index.json`.
- **Phase 3 — Performance (DONE)**: `check-perf.cjs` (render-blocking regression guard)
  wired into `quality.yml` (Cycle 30). D3/KG confirmed page-scoped + deferred (not global).
- **Phase 4 — Hygiene (DONE)**: `deploy-ipfs.yml` already disabled + documented;
  `.ci/` added to `.gitignore` (Cycle 31). Stale metrics/status docs corrected
  (Cycles 33–34, 36).
- **Phase 5 — Agentic Publishing (DONE)**: frontmatter schema gate (Cycle 13), link
  guards (Cycle 15/26), a11y guard (Cycle 9/33), OG-image guard, content-contract
  hard gate all wired and green.
- **Cycle 35 (DONE)**: DAO security static audit (`audit-dao.cjs`) wired into
  `deploy-dao.yml` test job.
- **Cycle 38 (DONE)**: `helpers.supports()` `CSS`-undefined crash fixed; jest coverage
  added for `supports`/`requestIdleCallback`.

## Remaining GATE-2 items (pending user confirmation — NOT done autonomously)

- **Archive/remove root stale files**: `RECOMMENDATIONS.md`, `Manifest.md`, `.bolt/`
  (tracked at repo root; `STRATEGY_INDEX.md` previously claimed "Archived 2026-08-17"
  — FALSE, they are still present; corrected to "flagged for archival, pending
  confirmation"). Per AGENTS.md + memory rule, deletion/archival of these is BLOCKED
  pending your explicit approval.
- **`AGENTS.md` edit (T93)**: point priority-order reference from stale
  `docs/SSG_MIGRATION_PLAN.md` to `docs/architecture/AUDIT-2026-08.md` +
  `.planning/ROADMAP.md`, and add a "Planning & task tracking" section. Blocked:
  protected agent-instruction file, approval timed out.

## Task index (beads)

| ID | Title | Status |
|----|-------|--------|
| T72–T86 | Autonomous cycles 11–25 | done |
| T87 | Cycle 26: dead hand-authored links → archive snapshots | done |
| T88 | Planning consolidation (archive .gsd/.openspec/.specify) | done |
| T89 | R&D CI isolation (`test-rnd.yml`) | done |
| T90 | Search index: repoint R&D fetch to `/index.json`; remove dead `search.json` | done |
| T91 | Perf: wire `check-perf.cjs` into `quality.yml` | done |
| T92 | Hygiene: `.ci/` gitignored (`deploy-ipfs.yml` already disabled) | done |
| T93 | `AGENTS.md` update for single planning SoT | **blocked (GATE-2)** |
| T94 | Correct `ROADMAP_STATUS.md` stale CI claims | done |
| T95 | Correct `BASELINE_METRICS.md` stale numbers | done |
| T96 | Wire DAO security static audit into `deploy-dao.yml` | done |
| T97 | Correct `REPOSITORY_SURFACE.md` over-broad root-HTML claim | done |
| T98 | Add helpers tests; fix `supports()` CSS-undefined crash | done |

## Human gates (non-negotiable)

GATE-1 architecture/SSG · GATE-2 deletion/move of components/planning dirs ·
GATE-3/5 CI permissions/secrets/deploy · GATE-7 content publish.
Agent may NOT self-merge or alter secrets; PR + `gh pr merge --admin` only.
