# Repository Surface Audit

> Status snapshot: 2026-08-15 (post Hugo migration + P0 consolidation).
> See `docs/adr/0002-two-plane-architecture.md` for the formal plane boundary.

## Top-level classification

| Path | Status | Notes |
|------|--------|-------|
| `content/` | **active publishing** | Hugo posts/pages (blog, people, domini, knowledge-graph) |
| `config/` | **active publishing** | Hugo config (`_default/`) |
| `layouts/` | **active publishing** | giscus/subscription partials |
| `assets/` | **active publishing** | og-default.svg, lib/fuse (search) |
| `static/` | **active publishing** | robots.txt, data/knowledge-graph.json (generated) |
| `themes/blowfish` | **active publishing** | submodule v2.105.0 |
| `i18n/` | **active publishing** | ru/en |
| `contracts/dao/` | **active engineering** | Solidity DAO (not deployed to Pages) |
| `tests/hardhat/` | **active engineering** | Hardhat tests (9 passing) |
| `src/` | **retained engineering** | v4.0 ES modules (CRDT/P2P/DAO/BCI); not bundled by Hugo |
| `scripts/` | **active tooling** | content-contract, knowledge-graph, validators |
| `schema/` | **active tooling** | post-metadata.schema.json (Content Model) |
| `docs/` | **active docs** | ADR/, plans, audits |
| `.github/workflows/` | **active automation** | single publisher (`hugo.yml`) + quality/integration |
| `node_modules/` | **generated** | gitignored; `npm ci` rebuilds in CI |
| `public/`, `resources/` | **generated** | Hugo output; gitignored |
| `artifacts_hardhat/`, `cache_hardhat/` | **generated** | Hardhat build; gitignored |
| `coverage/` | **generated** | c8 report; gitignored |
| `dist/` | **legacy generated** | old esbuild/Jekyll output; gitignored, candidate for deletion |
| `css/`, `js/` (root) | **legacy generated** | old Jekyll frontend; superseded by `src/` + Hugo; not shipped |
| `404.html`, `index.html`, `archive.html`, `categories.html`, `feed.xml`, `manifest.json` | **mostly legacy generated** | old Jekyll build output in repo root; the `tags.html` root file is a genuine Hugo `layout: page` source (NOT stale). Verify which remain before deleting. |
| `_domini/` | **migrated** | moved to `content/domini/` in migration; legacy dir candidate for deletion |
| `_config.local.yml`, `.jekyll-metadata`, `.bolt/`, `.babelrc` | **legacy/tooling** | Jekyll/Babel leftovers; not used by Hugo |
| `.github/reviews/` | **generated** | PR review artifacts; not committed intentionally |

## Rules

- **Do not** reintroduce `bundle exec jekyll build` — the site is Hugo-only.
- **Do not** commit `node_modules/`, `public/`, `resources/`, `coverage/`,
  Hardhat artifacts, or `knowledge-graph.json` (all gitignored; CI regenerates).
- Engineering plane (`src/`, `contracts/dao/`) is independent of the Hugo
  deploy; a change there does not require a site rebuild.
- Candidate deletions (after confirming no inbound references): `dist/`,
  root-level legacy `*.html`/`css/`, `_domini/`, `.jekyll-metadata`, `.bolt/`.
