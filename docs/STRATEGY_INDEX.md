# Strategy Index

> Single navigation point for the project's strategic documents. Resolves the
> documentation contradiction flagged in the cleanup phase: multiple overlapping
> plans described the repo at different points in time (Jekyll-era vs Hugo-era).

## Authoritative documents

| Document | Role | Status |
|----------|------|--------|
| [`STRATEGIC_PLAN_2026-2028_UPDATED.md`](STRATEGIC_PLAN_2026-2028_UPDATED.md) | **Current strategy** (v2.0.0, two-plane Hugo + Engineering) | Active |
| [`adr/0002-two-plane-architecture.md`](adr/0002-two-plane-architecture.md) | Formal architecture boundary (Publishing vs Engineering) | Accepted |
| [`adr/0001-module-layering.md`](adr/0001-module-layering.md) | `src/` internal layering rule | Accepted |
| [`SSG_MIGRATION_PLAN.md`](SSG_MIGRATION_PLAN.md) | Jekyll → Hugo migration record (variant A) | Completed |
| [`REPOSITORY_SURFACE.md`](REPOSITORY_SURFACE.md) | Top-level path classification | Active |
| [`BASELINE_METRICS.md`](BASELINE_METRICS.md) | Reproducible metrics (coverage, CI, hygiene) | Active |

## Archived / superseded

| Document | Why archived |
|----------|--------------|
| `STRATEGIC_PLAN_2026-2027.md` (v1.0-era) | Pre-migration; superseded by the 2026-2028 UPDATED plan |
| External `стратегический-план-развития-репозитория...md` (v1.0, "Jekyll+Node hybrid") | Describes a **hybrid Jekyll+Node** repo and lists "migrate to Hugo" as Priority 1 — **obsolete**: Hugo migration is complete (Phase 7 + P0 consolidation, 2026-08-15). Kept only as historical context. |
| [`RECOMMENDATIONS.md`](../RECOMMENDATIONS.md) (root) | Jekyll-era editorial recommendations; **superseded** by the Hugo two-plane strategy + `EDITORIAL_STRATEGY.md`. Archived 2026-08-17 (doc-debt initiative). |
| [`Manifest.md`](../Manifest.md) (root) | Jekyll-era site manifest; **obsolete** after Hugo migration (no `_config.yml`/Jekyll build). Archived 2026-08-17 (doc-debt initiative). |

## What actually happened vs the v1.0 plan

The attached v1.0 plan assumed a hybrid Jekyll + Node.js repo and made "migrate
to Hugo" the top priority. That work is **done**:

- ✅ Hugo + Blowfish is the sole publisher (GitHub Pages source = GitHub Actions).
- ✅ Jekyll legacy (`_config.yml`, `_layouts/`, `_includes/`, `_sass/`, `_posts/`,
  `_site/`, `js/`, `build.js`, `build-jekyll.rb`) removed in Phase 7.
- ✅ Two-plane architecture formalized (ADR-0002); `src/` retained, not bundled.
- ✅ Content-contract is a hard gate for new posts (`hugo.yml`).
- ✅ Dead code (`embedding-cache.js`) removed; `.gitignore` restored.

The current roadmap is the **2026-2028 UPDATED** plan (Phases 0–4: stabilization,
quality/DX, product enhancement, differentiation, community). Follow it, not the
v1.0 hybrid document.
