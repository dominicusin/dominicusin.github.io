# Change: repo-gist-ingestion

Status: `done` (implemented, verified, merged, deployed)
Spec: `.specify/spec.md`
State: `.beads/beads.json` (graph: T1–T10 all `done`)
Execution: `.gsd/plan.md` (GSD engine record)

## Why
The site should mirror all public GitHub repositories (dominicusin + associated
orgs) and gists as readable pages with automatic updates — extending the site
ontology (repo/gist/org nodes in the KG) and adding a weighted tag cloud.

## What changes (contract scope — see spec.md for full R1–R7)
- Build-time generator `scripts/sync-github.cjs` (run before `hugo` in CI).
- New content sections: `/repositories/`, `/gists/`, `/ontology/`.
- New layouts: `layouts/repositories/{list,single}.html`, `layouts/gists/{list,single}.html`.
- KG gains `repository`/`gist`/`org` node types.
- CI (`hugo.yml`) gains cron + dispatch + sync step for automatic updates.

## Impact
- Generated content gitignored (no commit churn).
- Requires `GITHUB_TOKEN` (already provided to deploy workflow).
- Build time increases ~2–4 min (sync) — within the 30-min cron budget.

## Verification (signed off by GSD, see .gsd/plan.md)
- [x] Local: 128 repos + 100 gists generated
- [x] `hugo` 0 errors, 553 HTML
- [x] KG: 393 nodes / 699 edges incl. repo/gist/org
- [x] `check-links.cjs`: 0 broken across 654 pages
- [x] Live CI smoke test (run 31943633270): sync + wiki + KG + build + Pages deploy green
- [x] Merged via PR #107 (`9470502ab`), deployed to GitHub Pages
