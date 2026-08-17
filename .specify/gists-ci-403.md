# Spec — gists ingestion survives CI rate-limit (HTTP 403)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/gists-ci-403.md`.

## Context
PR #115 fixed flat gist pages, but live `/gists/` stayed empty. CI log (run
31996202654) shows `users/dominicusin/gists?per_page=100` → **HTTP 403** →
`gists: 0`. Repos succeed because the heavy repo storm (hundreds of API calls)
exhausts the CI token's secondary rate-limit BEFORE the gist call, which runs last.
Local test passed only because a full `gh auth token` was used.

## Requirements
- **R1** In `main()`, fetch + write gist pages BEFORE the repos loop, so gists
  consume the fresh CI quota.
- **R2** Remove `content/gists/*/` from `.gitignore` and commit the generated gist
  pages, so the deployed `/gists/` is never empty even if the CI gist API hits 403
  (guaranteed committed fallback). Repos remain gitignored.
- **R3** Add a gist cache fallback (mirror `getRepos` lines 108-110): on empty live
  fetch, reuse a last-good `gists-<user>.json` cache file.
- **R4** Live `/gists/` shows gists after next CI deploy; built `public/gists/index.html`
  has ≥ 90 gist cards; `curl` of a gist page returns 200.
- **R5** Safety: `hugo` 0 errors; lint clean; test pass; check-links 0 broken;
  check-perf 0 regressions.

## Acceptance (measurable)
- `content/gists/*.md` committed (tracked) after this change.
- Built site lists gists locally (≥90 cards) with gists fetched before repos.
- No behavior regression to repos (still ≥120 cards live).

## Out of scope
- Repo ingestion; CI token quota itself; per-gist rendering.
