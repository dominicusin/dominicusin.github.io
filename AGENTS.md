# Engineering Blog — AI Assistant Instructions

> **Priority order (per `docs/STRATEGIC_PLAN_2026-2027.md` + `docs/SSG_MIGRATION_PLAN.md`):**
> repo instructions (`AGENTS.md`, `docs/*.md`) WIN over any attached external plan.
> Consolidate — do not duplicate.

## Overview

Static engineering blog published by **Hugo v0.164.0** with the **Blowfish v2.105.0**
theme, deployed to GitHub Pages via the `hugo.yml` workflow (Pages source =
**GitHub Actions**). The legacy Jekyll + esbuild stack was removed in Phase 7
(see `docs/SSG_MIGRATION_PLAN.md` and tag `pre-phase7-legacy`).

Two planes:

- **Publishing plane** — Hugo content in `content/` (posts live in
  `content/blog/`; the old `content/posts/` path redirects via an alias).
  This is what ships to the public site.
- **Engineering / R&D plane** — `src/` (ES-module frontend experiments,
  theme-manager, search-engine, etc.) and `contracts/dao/` (Solidity DAO).
  This plane is **frozen R&D** (see Decision below): it is built/tested in CI
  but NOT deployed to the live blog.

## Architecture (current, authoritative)

```
content/                  # Hugo markdown (posts -> content/blog/, about, people, domini)
config/_default/          # hugo.toml (params, permalinks, outputs) + config.toml (theme)
layouts/partials/         # comments.html (giscus + Buttondown), subscription.html
i18n/                     # ru.yaml, en.yaml (Hugo i18n)
assets/                   # og-default.svg, lib/fuse/fuse.min.cjs (search)
static/                   # robots.txt, data/knowledge-graph.json (generated)
themes/blowfish/          # git submodule (v2.105.0)
src/                      # ES-module R&D frontend (NOT shipped by Hugo)
contracts/dao/            # Solidity DAO (GovernanceToken, ProposalEngine, SoulboundToken)
tests/                    # unit/ (jest), hardhat/ (dao.test.cjs)
schema/post-metadata.schema.json   # formal Content Model (JSON Schema draft-07)
scripts/                  # validate-frontmatter, ai-review, build-knowledge-graph, ci-content-contract
docs/                     # STRATEGIC_PLAN_2026-2027.md, SSG_MIGRATION_PLAN.md, ...
```

## Decision on the DAO / BCI / VR / CRDT layer (2026-08-15)

Per the consolidation phase, this layer is kept as a **frozen, documented R&D
sandbox** (option b): it demonstrates engineering expertise but is not part of
the shipped blog. Concretely:

- `src/` and `contracts/dao/` are retained and still compiled/tested in CI.
- **Secret-requiring deploy workflows are disabled by default:**
  - `deploy-dao.yml` — split into a `test` job (no secrets, runs on push/PR to
    `contracts/**`) and a `deploy` job that is `guarded` (fails loudly without
    `DEPLOY_PRIVATE_KEY` / `SEPOLIA_RPC_URL`). Deploy does NOT run from PRs.
  - `deploy-ipfs.yml` — **disabled** (legacy Jekyll build + Pinata credentials
    were compromised 2026-08-14; `pre-phase7-legacy` tag preserves the last
    Jekyll state if recovery is ever needed).
- `vr-export.yml` — kept build-only (emits `assets/vr` artifact, no Pages flip).

## CI contract (Content Model gate)

Single source of truth for post metadata: `schema/post-metadata.schema.json`,
enforced by `scripts/ci-content-contract.cjs` (run in `hugo.yml` as a soft gate).

- **Hard gate:** changed `content/blog/*.md` MUST satisfy the schema
  (run `node scripts/validate-frontmatter.cjs <file>`).
- **Soft gate:** `scripts/ai-review.cjs` on changed posts (reported, non-fatal).
- **Emit:** `static/data/knowledge-graph.json` (JSON-LD), published to
  `/data/knowledge-graph.json`.

Run `node scripts/ci-content-contract.cjs` locally to simulate the gate.

## Local workflow

```bash
npm ci                       # install
npm run lint                # eslint src/ tests/
npm test                    # jest unit tests (ES-module plane)
npm run build               # hugo --gc --minify  -> ./public
hugo server -D              # local preview (drafts on)
npx hardhat test           # Solidity DAO tests (engineering plane)
```

`hugo` is NOT installed in this environment's default toolchain (NixOS CGO
issue). A pure-Go binary is built with
`CGO_ENABLED=0 GOFLAGS=-mod=mod go install github.com/gohugoio/hugo@v0.164.0`
and lives at `$(go env GOPATH)/bin/hugo`. `hugo.yml` uses `peaceiris/actions-hugo`
in CI, so the version there is authoritative.

## Gotchas (learned during migration)

- Pages source MUST be `GitHub Actions` (Settings UI), not `branch: main`
  (legacy Jekyll). The API returns 422 for this switch — it is a manual step.
- Blowfish reads `theme = "blowfish"` from `config/_default/config.toml`, NOT
  from `hugo.toml` (Hugo ignores `theme` there).
- `enableSearch = true` requires `assets/lib/fuse/fuse.min.cjs` in PROJECT
  assets — `resources.Get` does not see the theme submodule's copy.
- `og:image` uses `params.defaultSocialImage` resolved via `resources.Get`, so
  the file must live in `assets/` (e.g. `assets/images/og-default.svg`), not
  `static/`.
- Posts dated in the future are NOT rendered by Hugo without `--future`.
- Branch protection requires `--admin` for merges; branch is `main` (no `master`).

## Coverage baseline (measured 2026-08-15, c8)

| Metric | Value |
|--------|-------|
| Statements | 76.57% |
| Branch | 64.52% |
| Functions | 73.3% |
| Lines | 76.57% |

This is the **official baseline** (not the aspirational 85% target, which
requires an E2E/Playwright layer — see `STRATEGIC_PLAN_2026-2027.md` Q3 2026).
Do not regress below these numbers on the `src/` plane without adding tests.
