# 🚀 CI/CD Pipeline Documentation — dominicusin.github.io

> Hugo (extended) + Blowfish v2.105.0 static site, deployed to GitHub Pages.
> This file is the authoritative map of `.github/workflows/`. Keep it in sync
> with the workflows — outdated docs are worse than no docs.

## Overview

| Concern | Workflow(s) |
|---|---|
| **Build & deploy to Pages** | `hugo.yml` |
| **Quality gate on PRs** | `quality.yml` (🔍 Quality CI — required by branch protection) |
| **E2E / accessibility** | `e2e.yml` (🎭 Playwright + axe-core) |
| **Awesome-list curation** | `awesome-discover.yml`, `awesome-refresh.yml` |
| **Security** | `security.yml`, `security-scan.yml`, `fortify.yml` (opt-in), `scorecard.yml`, `dependency-review.yml`, `sbom.yml` |
| **Content ingestion** | `sync_gists.yml`, `hugo.yml` (sync-github step) |
| **Maintenance** | `stale.yml`, `lock-threads.yml`, `greetings.yml`, `labeler.yml`, `size-label.yml`, `pr-title-check.yml`, `fediverse-notify.yml`, `analytics.yml`, `performance.yml` |
| **DAO / R&D** | `deploy-dao.yml`, `test-rnd.yml`, `vr-export.yml` |
| **Cache hygiene** | `cache-cleanup.yml` |

## 🔑 Branch protection & secrets

- `main` requires the **`🧪 Build, validate, test, link-check`** status check (from `quality.yml`) before merge.
- Workflows that push branches / open PRs (`awesome-discover`, `awesome-refresh`) need
  **repo-level Actions "Workflow permissions" = `write`** (Settings → Actions → General).
  A YAML `permissions:` block is *not* sufficient when the repo default is read-only —
  this was the root cause of the earlier `github-actions[bot]` 403s.
- Required secrets: `GIST_TOKEN`, `PINATA_API_KEY/JWT/SECRET_API_KEY`.
  Optional: `FOD_TENANT`/`FOD_PAT` (or `SSC_*`) **plus** repo variable `FORTIFY_ENABLED=true`
  to enable the Fortify scan (otherwise `fortify.yml` is skipped cleanly).

## 🏗️ `hugo.yml` — Deploy Hugo site to GitHub Pages

**Triggers**: push to `main`, every 30 min (`*/30 * * * *`), `repository_dispatch: sync-github`, `workflow_dispatch`.

Steps (build job):
1. Checkout (submodules recursive) → init wiki submodule → init awesome submodules (sparse).
2. Generate wiki navigation (`generate-wiki-nav.py`).
3. Cache npm + Hugo build cache (`~/.cache/hugo_cache`, `hugo_modules`).
4. `node scripts/sync-github.cjs` — ingest repos/gists (graceful: never fails deploy).
5. `sanitize-generated.cjs` — strip executable vectors from generated pages (trust boundary).
6. `ci-content-contract.cjs` — hard gate on **new** `content/blog/` posts.
7. Rebuild knowledge graph / ontology / crosslinks.
8. `refresh-awesome.cjs` + `build-awesome.cjs` — advance & render curated lists.
9. `hugo --gc --minify --baseURL <pages>` → upload Pages artifact → `actions/deploy-pages`.

The deploy `build` job also runs a **report-only** performance smoke check (`check-perf.cjs`).

## 🔍 `quality.yml` — Quality CI (required check)

**Triggers**: `pull_request` to `main`, `workflow_dispatch`. Does **not** deploy.
Mirrors the four-stage plan: build → validate → test → link/HTML check.

Steps: build (Hugo), perf smoke, content-contract, eslint, **broken-internal-link check**
(`check-links.cjs`), source-link audit (report-only), HTML well-formedness (report-only),
external-link audit (report-only), axe-core a11y audit (report-only), OG-image guard
(report-only). Hugo + npm build caches are enabled for speed.

## 🎭 `e2e.yml` — Playwright E2E

Runs on push/PR/dispatch. Spins up a Hugo dev server, then `npx playwright test`:
- `accessibility.spec.cjs` — axe-core, fails on **critical/serious** violations
  (ignores `color-contrast`, `html-has-lang`, `scrollable-region-focusable`).
- `smoke.spec.cjs` — core navigation smoke.

> The `/about/` Twitter link once lacked a closing `</a>` + `.social-text`, causing 2
> serious `link-name` violations — fixed in `content/about.md` (see issue #248).

## ⭐ Awesome-list curation

- **`awesome-discover.yml`** — weekly + manual. Searches GitHub `topic:awesome` by stars,
  groups by topic, adds up to `MAX_NEW` (default 3) new sparse submodules under `awesome/`,
  regenerates the catalog, **builds the site as a guard** (Setup Hugo step added), then opens a PR.
- **`awesome-refresh.yml`** — weekly + manual. Advances every `awesome/*` submodule to its
  latest tip, regenerates catalog + previews, opens a PR on change.

Both call `build-awesome.cjs`, which rewrites README relative links → absolute GitHub blob
URLs (per submodule branch) so generated preview pages never publish broken internal links.

## 🧹 `cache-cleanup.yml`

Weekly (Mon 04:37 UTC) + dispatchable. Prunes GitHub Actions caches, keeping the N newest
per cache key (default 3). `dry_run` input available. Never fails the run.

## 🔒 Security

- `security.yml` / `security-scan.yml` — npm audit, Semgrep, Trivy, CodeQL.
- `scorecard.yml` — OpenSSF Scorecard.
- `dependency-review.yml` — blocks PRs that add vulnerable deps.
- `sbom.yml` — generates an SBOM.
- `fortify.yml` — **opt-in** SAST (see secrets above); skipped unless `FORTIFY_ENABLED=true`.

## 🛠️ Local dev

```bash
npm ci
hugo server -D            # preview
node scripts/build-awesome.cjs
node scripts/check-links.cjs
npx playwright test        # needs browsers: npx playwright install --with-deps chromium
```

## 📌 Maintenance notes

- Merged feature/bot branches are deleted after their PR is merged — keep `origin` free of
  stale refs.
- One-off migration scripts live in `scripts/archive/` (e.g. `migrate-jekyll-to-hugo.cjs`).
- Document any new workflow here within the same PR that adds it.
