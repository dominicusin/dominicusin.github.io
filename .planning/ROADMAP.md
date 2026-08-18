# Roadmap — `dominicusin.github.io`

Single source of truth for execution planning. Task graph lives in `.beads/beads.json`.
Requirements/initiatives live in `.planning/initiatives/`. Architecture decisions in
`docs/architecture/ADR-*.md`. This file is the human-readable index.

## Phases

- **Phase 0 — Baseline (DONE 2026-08-18)**: `docs/architecture/AUDIT-2026-08.md` records
  verified current state. Planning dirs consolidated: `.planning/` = requirements SoT,
  `.beads/` = live task graph; `.gsd`/`.openspec`/`.specify` archived.
- **Phase 1 — Consolidation (NEXT)**: TASK-C2 R&D CI isolation; update `AGENTS.md`.
- **Phase 2 — Reliability**: search index verified full via `public/index.json` (384 entries, 4.35 MB); dead root `search.json` removed (Cycle 29); R&D search code repointed to `/index.json`.
- **Phase 3 — Performance**: asset budget in CI; lazy-load D3/KG (R3).
- **Phase 4 — Hygiene**: disable/remove `deploy-ipfs.yml`; add `.ci/` to `.gitignore` (R5).
- **Phase 5 — Agentic Publishing**: content PR protocol (frontmatter/link/JSON-LD/a11y gates).
- **Phase 6+ — Observability / Advanced R&D**: Web Vitals in `analytics.yml`; vector search
  only if a metric justifies it.

## Task index (beads)

| ID | Title | Status |
|----|-------|--------|
| T72–T86 | Autonomous cycles 11–25 (i18n, security, schema, img-alt, ext-links, license, CI guards, analytics, fediverse, vr-export, perf, KG-url, data-doc, security-audit) | done |
| T87 | Cycle 26: dead hand-authored links → archive snapshots | done |
| T88 | Planning consolidation (archive .gsd/.openspec/.specify) | done |
| T89 | R&D CI isolation (`test-rnd.yml`, Chromium steps optional) | pending |
| T90 | Full `search.json` generation + coverage check | pending |
| T91 | Asset budget CI + lazy D3/KG | pending |
| T92 | `deploy-ipfs.yml` disabled + `.ci/` gitignored | pending |
| T93 | `AGENTS.md` update for single planning SoT | pending |

## Human gates (non-negotiable)

GATE-1 architecture/SSG · GATE-2 deletion/move of components/planning dirs ·
GATE-3/5 CI permissions/secrets/deploy · GATE-7 content publish.
Agent may NOT self-merge or alter secrets; PR + `gh pr merge --admin` only.
