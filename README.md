# dominicusin.github.io — Engineering Blog (Hugo + Blowfish)

[![Deploy](https://github.com/dominicusin/dominicusin.github.io/actions/workflows/hugo.yml/badge.svg)](https://github.com/dominicusin/dominicusin.github.io/actions/workflows/hugo.yml)
[![Tests](https://img.shields.io/badge/tests-277%20jest%20%2B%209%20hardhat-brightgreen)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Static engineering blog built with **Hugo** + the **Blowfish** theme, deployed to GitHub Pages.
> Migrated from the legacy Jekyll + esbuild stack (see `docs/SSG_MIGRATION_PLAN.md`).

Domini's personal engineering blog: industrial engineering, systems engineering, and data science,
plus decentralized-web / DAO notes.

## 🚀 Architecture (two planes)

This repository deliberately separates **publishing** from **engineering tooling**:

- **Publishing Plane** — the website.
  - Generator: Hugo (extended) + Blowfish theme (git submodule at `themes/blowfish`).
  - Content: `content/` (blog posts in `content/blog/`, `content/people/`, `content/domini/`).
  - Config: `config/_default/` (`hugo.toml`, `config.toml`, `params` inline, `menus.*.toml`, `languages.toml`).
  - Comments: [giscus](https://giscus.app) (GitHub Discussions backend, category "Announcements").
  - Subscription: Buttondown form (`layouts/partials/subscription.html`).
  - i18n: `i18n/{ru,en}.yaml` (ru default, en secondary).
  - Build/deploy: `.github/workflows/hugo.yml` → GitHub Pages (single publisher).
- **Engineering Plane** — smart-contract / DAO tooling (kept separate, NOT deployed to the site).
  - `contracts/dao/` — Solidity sources.
  - `tests/hardhat/` — Hardhat tests (`npx hardhat test`, 9 passing).
  - `scripts/` — content-contract + knowledge-graph generation.
  - `src/` — v4.0 frontend modules (CRDT/P2P/DAO/BCI adapters). Retained for the engineering
    substrate; not bundled into the static site (Hugo ignores `src/`).

See [`docs/adr/0002-two-plane-architecture.md`](docs/adr/0002-two-plane-architecture.md) for the
formal two-plane boundary, integration points, and DAO lifecycle.

## 🛠 Local development

```bash
# 1. Install Hugo (extended) — e.g. via Go:
#    CGO_ENABLED=0 go install github.com/gohugoio/hugo@v0.164.0
# 2. Init the theme submodule:
git submodule update --init --recursive
# 3. Run the dev server (drafts included):
hugo server -D
# 4. Production build:
hugo --gc --minify
```

The site is served from `public/` after a build. `public/` and `resources/` are git-ignored.

## 📦 Content model

- Posts live in `content/blog/` as `YYYY-MM-DD-slug.md`. Frontmatter is normalized
  (title, date ISO-8601, categories, tags, authors, draft, slug).
- Legacy permalinks are preserved via Hugo `aliases` (e.g. `/2015/11/19/first.html` → `/2015/11/19/first/`).
- The `content/posts` → `content/blog` rename keeps post URLs intact; `/posts/` now aliases `/blog/`.
- Every **new** post (added in a PR) is validated as a **hard gate** against
  `schema/post-metadata.schema.json` in CI (`scripts/ci-content-contract.cjs`):
  an invalid new post **blocks the deploy**. Modified legacy posts (e.g. 2015
  posts lacking tags/author) are report-only and do not block.
- Author hint: run `node scripts/ci-content-contract.cjs` locally before push to
  self-check; `node scripts/validate-frontmatter.cjs content/blog/<file>` validates a single post.

## 🔧 Key files

| Path | Purpose |
|------|---------|
| `config/_default/hugo.toml` | Site + Blowfish params, permalinks, outputs, giscus, subscription URL |
| `config/_default/config.toml` | `theme = "blowfish"` declaration |
| `themes/blowfish` | Theme submodule (v2.105.0) |
| `content/` | All site content |
| `layouts/partials/comments.html` | giscus + subscription injection |
| `i18n/` | ru/en translations |
| `contracts/dao/`, `tests/hardhat/` | DAO engineering plane |
| `.github/workflows/hugo.yml` | The only GitHub Pages publisher |

## ⚙️ CI/CD (single publisher model)

Only `.github/workflows/hugo.yml` deploys to GitHub Pages. Other workflows are
quality/support and never flip the Pages source.

| Workflow | Purpose | Deploys? |
|----------|---------|----------|
| `hugo.yml` | Build + **content-contract hard gate (new posts)** + deploy to Pages | ✅ yes |
| `hugo-build-check.yml` | Build-only sanity check | ❌ |
| `security.yml` | Node audit + Trivy + Semgrep (weekly) | ❌ |
| `performance.yml` | Lighthouse audit against live Pages URL | ❌ |
| `dependency-update.yml` | Dependabot-driven bumps | ❌ |
| `link-repair.yml` | Scheduled broken-link check | ❌ |
| `deploy-dao.yml` | `test` job (Hardhat, no secrets) + guarded `deploy` (needs secrets) | ❌ (separate track) |
| `vr-export.yml` | Build-only VR artifact (no Pages flip) | ❌ |
| `sync_gists.yml`, `analytics.yml`, `fediverse-notify.yml` | Post-deploy integrations | ❌ |
| `deploy-ipfs.yml` | **DISABLED** (legacy Jekyll + compromised Pinata) | ❌ |

> The legacy Jekyll CI (`ci.yml`, `jekyll.yml`, `ci-cd.yml`) was removed in
> Phase 7. Do not reintroduce `bundle exec jekyll build` — the site is Hugo-only.

## 🧠 Knowledge Hub (Engineering Knowledge Platform)

The site is more than a blog: it is a navigable knowledge base.

- **Knowledge Graph** (`/knowledge-graph/`) — interactive concept/post explorer
  backed by `/data/knowledge-graph.json` (JSON-LD, generated each build). Noscript
  fallback via `/categories/` + `/tags/`.
- **Community** (`/community/`) — giscus (GitHub Discussions) comments + Buttondown
  subscription, with discussion norms and a privacy note.
- **Editorial strategy**: `docs/EDITORIAL_STRATEGY.md` (content directions, taxonomy,
  people/domini rules, author checklist).
- **DAO track**: `docs/DAO_ROADMAP.md` (contracts, test/deploy, threat model).
- **Architecture**: `docs/adr/0002-two-plane-architecture.md` (Publishing vs Engineering).
- **Content contract**: `docs/CONTENT_CONTRACT.md` (new posts are a hard gate).

## 🧹 Legacy (removed)

The legacy Jekyll + esbuild stack (`_config.yml`, `Gemfile`, `_layouts/`, `_includes/`,
`_sass/`, `_posts/`, `_site/`, `js/`, `build.js`, `build-jekyll.rb`) and the Jekyll CI workflows
(`ci.yml`, `jekyll.yml`, `ci-cd.yml`) were **removed** in Phase 7 (rollback point tagged
`pre-phase7-legacy`). The Hugo site is the sole publisher. `src/` (DAO/CRDT modules) and
`contracts/dao/` are retained as the engineering plane.

## 📄 License

MIT — see `LICENSE`.
