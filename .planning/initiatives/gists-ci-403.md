# BMAD — Initiative: `gists-ci-403`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Self-identified + user-reported: live /gists/ empty despite PR #115 (flat pages).
> Contract → Spec Kit. State → Beads. Execution → GSD.

## Why (reasoning) — ROOT CAUSE, VERIFIED FROM CI LOG
After PR #115 (flat gist pages) merged, live `/gists/` was STILL empty. Verified CI
deploy run 31996202654 "Sync GitHub repos + gists" step log:
```
✗ https://api.github.com/users/dominicusin/gists?per_page=100: HTTP 403
  gists: 0
```
While repos succeeded: `dominicusin: 105, neoallunity: 11, Hitech-gmbh: 0,
transgregorial: 6`. So the gist API call returns **HTTP 403** in CI → `gists=[]`
→ no gist pages written → empty `/gists/`.

WHY 403 in CI but not locally: `main()` fetches ~122 repos FIRST, each doing
README+CONTRIBUTING+LICENSE+doc calls (~hundreds of API hits). By the time it
reaches the gists call (~3.5 min in), the **CI GITHUB_TOKEN hits GitHub's
secondary rate-limit / abuse detection** on the gists endpoint. Locally I used a
full `gh auth token` with a much larger quota, so gists succeeded — making my
local "green" test a FALSE POSITIVE for the CI environment.

## Shape (locked decisions)
1. **Reorder `main()`: gists BEFORE repos.** Gists are cheap (1 list call + N file
   calls); repos are heavy. Fetching gists first consumes the fresh CI quota
   before the repo storm exhausts it.
2. **Un-ignore `content/gists/*/` in `.gitignore`.** Commit the generated gist
   pages so the deployed `/gists/` is NEVER empty even if the CI gist API call
   hits 403 (guaranteed committed fallback). Repos stay gitignored (122 heavy
   pages; they already work in CI).
3. **Add a gist cache fallback** mirroring `getRepos` (lines 108-110): if live
   fetch returns nothing, reuse a committed/last-good `gists-<user>.json` cache.
4. **Graceful:** build stays 0-error; lint/test/linkcheck/perf-gate green; no
   change to repo ingestion or data shape.

## Out of scope
- Repo ingestion changes (works in CI). Rate-limit of the CI token itself (env).
- Per-gist page rendering (already correct after #115).

## Handoff
- → Spec Kit `.specify/gists-ci-403.md`.
- → Beads `.beads/beads.json`: T41–T44.
- → GSD `.gsd/plan.md`: Phase L execution + evidence.
