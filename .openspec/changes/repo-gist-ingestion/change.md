# Change: repo-gist-ingestion

Status: `in_progress` (implementation complete; verification + CI smoke test remaining)
Spec: `.specify/spec.md`
State: `.beads/beads.json`

## Why
The site should mirror all public GitHub repositories (dominicusin + associated
orgs) and gists as readable pages with automatic updates — extending the site
ontology (repo/gist/org nodes in the KG) and adding a weighted tag cloud.

## What changes
- New build-time generator `scripts/sync-github.cjs` (run before `hugo` in CI).
- New content sections: `/repositories/`, `/gists/`, `/ontology/`.
- New layouts: `layouts/repositories/{list,single}.html`, `layouts/gists/{list,single}.html`.
- KG gains `repository`/`gist`/`org` node types.
- CI (`hugo.yml`) gains cron + dispatch + sync step for automatic updates.

## Impact
- Generated content gitignored (no commit churn).
- Requires `GITHUB_TOKEN` (already provided to deploy workflow).
- Build time increases ~2–4 min (sync) — within the 30-min cron budget.

## Verification
- [x] Local: 128 repos + 100 gists generated
- [x] Local: `hugo` 0 errors, 553 HTML
- [x] KG: 393 nodes / 699 edges incl. repo/gist/org
- [ ] Re-run link-check after T7 rel-link fix (blocked on API rate limit)
- [ ] Live CI run with `INCLUDE_WIKI=true`
