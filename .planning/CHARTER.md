# Governance & Reasoning Layer

> **Sole responsibility: WHY + SHAPE + locked governance decisions.**
> Does NOT define "what" (requirements) or "how to execute" (task graph) — those
> live in `.planning/initiatives/` and `.beads/beads.json` respectively.
> Legacy planning tools (Spec Kit / `.specify/`, GSD / `.gsd/`, OpenSpec / `.openspec/`)
> were **archived to `docs/archive/` in Cycle 27 (PR #147)** and are no longer active.
> This file is part of the current Planning SoT (`.planning/` + `.beads/`).

## Project
`dominicusin.github.io` — Hugo + Blowfish engineering blog & decentralized-web
notes. Single prod path (Hugo). Branch protection: all changes via PR + `gh pr merge --admin`.

## Active Initiative (charter only)
**Auto-ingest GitHub repositories + gists as first-class site pages, with a tag
cloud and an expanded site ontology — updating automatically.**

## Locked governance decisions (immutable for this initiative)
1. **Build-time generation, not committed content.** Repo/gist pages are generated
   by `scripts/sync-github.cjs` *before* `hugo` runs in CI and locally via
   `npm run sync:github`; gitignored. Rationale: avoids commit churn, respects
   branch protection, makes "new gist/repo appears automatically" a pure CI concern.
2. **Single source of truth = GitHub.** Site never stores repo/gist bodies; fetched
   live at build (ETag-cached). **Graceful degradation is mandatory**: a failed
   fetch or rate-limit MUST NEVER break the build (script exits 0; failed pages
   just have thinner bodies).
3. **No secrets beyond `GITHUB_TOKEN`.** Public data only; the deploy workflow's own
   `secrets.GITHUB_TOKEN` (5000 req/h, fresh each run) suffices. No PAT required.
4. **Every generated artifact is verifiable.** `hugo` 0 errors + `check-links.cjs` 0
   broken + KG regenerates. **No fabricated verification** — GSD must show real output.

## Discovery (context for the "why", not the contract)
- Inventory (verified via `gh`): `dominicusin` 100+ repos (many forks), orgs
  `neoallunity` (integral-philosophy), `Hitech-gmbh` (empty), `transgregorial`
  (nixpkgs/SPF.JS/trackerslist). 43+ public gists.
- Existing `sync_gists.yml` dumps gists to `gists/` but does NOT render them —
  superseded by build-time generation.
- Rate budget: ~150 repos × (README + license + contributing + docs probe) ≈
  600–900 calls/run (< 5000/h). Batched concurrency (8) → ~2–4 min runtime.
  Wiki clones (opt-in `INCLUDE_WIKI=1`) add time, not API calls.

## Handoff contract (current SoT — post Cycle 27 consolidation)
- **Requirements**: live in `.planning/initiatives/` (supersedes the old Spec Kit /
  `.specify/spec.md` requirements doc, now archived).
- **State graph (nodes/edges)**: live in `.beads/beads.json` (supersedes the old
  GSD / `.gsd/plan.md` executor; GSD archived in Cycle 27).
- **Architecture decisions**: `docs/architecture/ADR-*.md`.
- **Roadmap**: `.planning/ROADMAP.md`.

Legacy tools archived (Cycle 27, #147): `.gsd/`, `.openspec/`, `.specify/`.
They are historical context only and MUST NOT be treated as active systems.
