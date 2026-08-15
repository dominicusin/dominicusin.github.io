# dominicusin.github.io — Engineering Blog (Hugo + Blowfish)

[![Deploy](https://github.com/dominicusin/dominicusin.github.io/actions/workflows/hugo.yml/badge.svg)](https://github.com/dominicusin/dominicusin.github.io/actions/workflows/hugo.yml)
[![Tests](https://img.shields.io/badge/tests-277%20passed-brightgreen)](tests/)
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
- Every changed post is validated against `schema/post-metadata.schema.json` in CI
  (`scripts/ci-content-contract.cjs` — soft gate; legacy posts lacking tags/author are reported, not blocked).

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

## 🧹 Legacy (not yet removed)

The legacy Jekyll + esbuild stack (`_config.yml`, `Gemfile`, `_layouts/`, `_sass/`, `js/`,
`src/` frontend runtime, `build.js`) is **still present** but no longer deployed. Removal is
deferred to a later cleanup pass (see `docs/SSG_MIGRATION_PLAN.md`, Phase 7) once the Hugo site
has proven stable. `src/` (DAO/CRDT modules) is retained regardless.

## 📄 License

MIT — see `LICENSE`.
