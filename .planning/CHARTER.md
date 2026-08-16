# BMAD — Governance & Reasoning Layer

> Role in the stack: **Product / Architecture reasoning + governance**. Defines
> *why* and *what shape* the work takes. Downstream consumers: Spec Kit (contract),
> Beads (state graph), GSD (execution).

## Project
`dominicusin.github.io` — Hugo + Blowfish engineering blog & decentralized-web
notes. Single prod path (Hugo). Branch protection: all changes via PR + `gh pr merge --admin`.

## Active Initiative
**Auto-ingest GitHub repositories + gists as first-class site pages, with a tag
cloud and an expanded site ontology — updating automatically.**

## Governance decisions (locked)
1. **Build-time generation, not committed content.** Repo/gist pages are generated
   by `scripts/sync-github.cjs` *before* `hugo` runs in CI (and locally via
   `npm run sync:github`). They are gitignored. Rationale: avoids commit churn,
   respects branch protection, and makes "new gist/repo appears automatically"
   a pure CI concern.
2. **Single source of truth = GitHub.** The site never stores repo/gist bodies;
   they are fetched live at build (ETag-cached). Graceful degradation: a failed
   fetch or rate-limit must NEVER break the build (script exits 0, pages that
   failed just have thinner bodies).
3. **No secrets beyond `GITHUB_TOKEN`.** Public data only; the deploy workflow's
   own `secrets.GITHUB_TOKEN` (5000 req/h, fresh each run) is sufficient. No PAT
   required.
4. **Every generated artifact is verifiable.** Build must be clean (`hugo` 0 errors),
   internal links must pass `scripts/check-links.cjs` (0 broken), and the KG must
   regenerate. No fabricated verification.

## Discovery notes
- Inventory (verified via `gh`): `dominicusin` 100+ repos (many forks), orgs
  `neoallunity` (integral-philosophy suite), `Hitech-gmbh` (empty), `transgregorial`
  (nixpkgs/SPF.JS/trackerslist). 43+ public gists.
- Existing `sync_gists.yml` dumps gists to `gists/` but does NOT render them —
  superseded by build-time generation.
- Rate budget: ~150 repos × (README + license + contributing + docs probe) ≈
  600–900 calls/run; well under 5000/h. Batched concurrency (8) keeps runtime
  ~2–4 min. Wiki clones (opt-in `INCLUDE_WIKI=1`) add time but not API calls.

## Handoff contract to Spec Kit
See `../.specify/spec.md` for the binding requirements + acceptance contract.
State graph lives in `../.beads/beads.json`.
