# Roadmap Status — Synthesis of All Strategy Inputs

> **Purpose.** Four planning documents have been fed into this project over time,
> and they overlap and sometimes contradict each other (notably the older ones
> describe a pre-migration "Jekyll + Node hybrid" that no longer exists). This
> document is the **single source of truth** for what is DONE vs OPEN, derived
> from the actual repository state, not from the plans' assumptions.
>
> Source plans:
> 1. `STRATEGIC_PLAN_2026-2027.md` (v1.0) — **superseded** (Jekyll-hybrid, outdated)
> 2. `STRATEGIC_PLAN_2026-2028_UPDATED.md` (v2.0.0) — **authoritative**
> 3. 10-phase migration model (Jekyll→Hugo) — **all 10 phases complete**
> 4. 3-Pillar + 4-Stage plan (Architecture → CI/CD → SEO → Network) — **in progress**
>
> Navigation: `docs/STRATEGY_INDEX.md` resolves which plan doc is current.

## Legend
- ✅ Done & verified
- 🔄 Done in code, needs content/adoption
- 📋 Open / planned
- ⚠️ Known limitation (documented, not blocking)

## Status matrix

| Initiative (from plans) | Status | Evidence / Notes |
|------------------------|--------|------------------|
| **SSG migration Jekyll → Hugo + Blowfish** | ✅ | `themes/blowfish` submodule; `config/_default/`; 160 HTML build |
| **Remove Jekyll/esbuild legacy (Phase 7 + P9)** | ✅ | `_config.yml`, `_layouts`, `dist/`, `css/`, `_domini/` removed; `REPOSITORY_SURFACE.md` |
| **Two-plane architecture (ADR-0002)** | ✅ | `docs/adr/0002-two-plane-architecture.md` |
| **Content Contract — hard gate for NEW posts** | ✅ | `hugo.yml` runs `ci-content-contract.cjs` (merge-base diff, no `\|\| true`) |
| **Content Contract — soft/report for legacy** | ✅ | `ci-content-contract.cjs` split added(hard)/modified(soft) |
| **giscus + Buttondown community** | ✅ | `layouts/partials/comments.html`; `/community/` page |
| **Playwright E2E (smoke + a11y/axe-core)** | ✅ | `e2e.yml`, 14 passing (9 smoke + 5 a11y) |
| **Lighthouse performance budget in CI** | ✅ | `performance.yml` + `.lighthouserc.json` (error asserts, LCP≤2.5s/CLS≤0.1) |
| **Knowledge Graph public page** | ✅ | `/knowledge-graph/` + `static/js/knowledge-graph.js` + JSON-LD data |
| **Engineering-plane surfacing (READMEs, /projects/)** | ✅ | `contracts/dao/README.md`, `src/README.md`, `scripts/README.md`, `content/projects/` |
| **Author backfill on legacy posts** | ✅ | `backfill-frontmatter.cjs` → `author: DominicusIn` on 59 posts |
| **Consolidated Quality CI (separate from deploy)** | ✅ | `quality.yml` (build/contract/jest/hardhat/lint/links) — green |
| **Broken-link check** | ✅ | `scripts/check-links.cjs` (193 links, 0 broken) |
| **HTML well-formedness / a11y spot-check** | ✅ | `scripts/check-html.cjs` (corrected: only flags imgs with NO `alt`; 0 warnings after fix) |
| **JSON-LD structured data** | ✅ | Blowfish `schema.html` emits `WebSite`/`Article` JSON-LD per page |
| **SEO/permalink audit + aliases** | ✅ | legacy `/posts/`, `/blog/`, old `.html` → 200 via aliases |
| **Single Pages publisher (hugo.yml only)** | ⚠️ | GitHub Pages (`hugo.yml`) is the canonical deploy. Vercel ALSO builds `main` (auto-detected, no manual trigger) — see note below. Both pin Hugo 0.164.0. |
| **DAO roadmap / threat model** | ✅ | `docs/DAO_ROADMAP.md`; Hardhat 9/9; `deploy-dao.yml` guarded |
| **Editorial strategy / taxonomy** | 📋 | `docs/EDITORIAL_STRATEGY.md` exists; legacy `categories`/`tags` still sparse |
| **Semantic / graph-assisted search** | 📋 | KG is browseable; no semantic search backend yet |
| **i18n ru/en parity + more languages** | ⚠️ | ru/en config present; parity not audited; other langs not started |
| **PWA offline / push** | ⚠️ | `pwa-service.test.js` quarantined; SW not shipped by Hugo build |
| **package.json prune to Hugo-only deps** | 📋 | deps still include legacy esbuild/Jest/test stack |
| **Coverage floor as CI gate** | 📋 | c8 baseline 76% lines/64% branch (src only); full `--all` 41% (legacy R&D untested) |
| **Content series (systems/data-science/DAO deep-dives)** | 📋 | no series published yet |
| **DAO security audit before any deploy** | 📋 | threat model documented; no external audit; deploy guarded (no secrets) |
| **PR preview deployments** | 📋 | not configured (GitHub Pages single env) |
| **ActivityPub / IndieWeb / JSON Feed beyond RSS** | 📋 | RSS + JSON index exist; richer machine feeds not started |
| **doc-debt backlog (doc-debt-and-hardening)** | 🔄 | Phases 0–4 done (PRs #120–#123). Phases 5–6 (i18n parity, ROADMAP_STATUS reconcile) in progress. Granular status lives in the Beads graph (`.beads/beads.json` T1–T71); this doc is the strategic synthesis. |

## Inductive findings (from observed repo behavior)
- The **content-contract gate must diff against `merge-base(origin/main, HEAD)`**, not a three-dot range — a squash-merge otherwise flags all 59 posts as "added" and hard-blocks the deploy. (Fixed in #83.)
- The **jest `--testPathIgnorePatterns` CLI flag REPLACES the config list**, not appends — passing a partial list silently un-quarantines broken suites. Quarantine belongs in `jest.config.js`. (Fixed in #90.)
- **`vr-export.yml` declared `pages: write` but never deploys** — a least-privilege violation, now tightened.
- **`check-html.cjs` `<img>`-alt check used `/\salt=/`** which missed a *bare* `alt` attribute (Hugo renders markdown `![]()` as `<img alt src=...>`, valid empty alt). This produced 39 false-positive "missing alt" warnings. Corrected to `/\balt\b/` — only flags imgs with NO alt attribute. After the fix the real gap was just 16 decorative logo `<img>` in `ai2.md` (+1 in cyber-security), now fixed with `alt=""`.

## Deductive recommendations (next)
1. **Retire `hugo-build-check.yml`** — fully subsumed by `quality.yml` (less workflow noise, per the strategy's "reduce workflows" goal). ✅ Done (#93).
2. **Backfill `tags` on legacy posts** (free-form, no enum risk) to enrich the Knowledge Graph and SEO; `categories` require editorial choice (enum-restricted) — leave for manual curation.
3. **Fix the `<img>` missing `alt`** — ✅ Done (#94): corrected the checker false-positive and added `alt=""` to 16 decorative logo imgs in `ai2.md` + `cyber-security.md`.
4. **Package.json prune** — split content-tooling vs legacy engineering deps to shrink `npm ci` and supply-chain surface.
5. **i18n ru/en parity audit** — confirm Blowfish ru/en content parity; add languages only after audit.

## Open architectural decisions (deferred, not blocked)
- `/api/*` removal from publishing layer — **already satisfied** (no `/api/` exists in repo).
- DAO Sepolia→mainnet — only after external audit; deploy job guarded.
- BCI/CRDT/P2P — frozen R&D (option b), no active CI triggers.
- **Dual publisher (GitHub Pages + Vercel)** — Vercel auto-builds `main` (auto-detected; `vercel.json` pins Hugo 0.164.0 extended). GitHub Pages via `hugo.yml` is the canonical pipeline. Live domain resolves to Vercel. Both produce identical static output from the same source, so divergence risk is low, BUT: (a) two independent build environments must stay on Hugo 0.164.0; (b) Vercel's build is NOT gated by `quality.yml`/`content-contract` (only the GitHub Pages path is). If a content-contract-invalid post lands, GitHub Pages deploy is blocked but Vercel still publishes it. Decision (2026-08-16): keep both, document, live domain → Vercel. Recommended hardening: add the content-contract gate as a Vercel build check, or disable Vercel auto-deploy and use it for previews only.
