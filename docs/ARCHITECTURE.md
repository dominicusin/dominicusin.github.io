# Architecture

> **Status (2026-08-15):** The site is published by **Hugo + Blowfish** (single
> publisher, `hugo.yml` → GitHub Pages). The legacy Jekyll + esbuild stack was
> removed in Phase 7. `src/` is retained as an **engineering substrate** that
> Hugo does NOT bundle. See `docs/adr/0002-two-plane-architecture.md` for the
> formal boundary.

## Two planes

```
repository root
├── content/        # Publishing plane — Markdown posts/pages
├── config/         #   Hugo config (_default/)
├── layouts/       #   partials (giscus, subscription)
├── assets/        #   og-default.svg, lib/fuse (search)
├── static/        #   robots.txt, data/knowledge-graph.json (generated)
├── themes/        #   blowfish (submodule v2.105.0)
├── i18n/          #   ru (default) / en
├── contracts/dao/ # Engineering plane — Solidity (NOT deployed to Pages)
├── tests/hardhat/ #   Hardhat tests (npx hardhat test, 9 passing)
├── src/           #   v4.0 ES modules (CRDT/P2P/DAO/BCI) — retained, not bundled
├── scripts/       #   content-contract + knowledge-graph generation
└── .github/       #   workflows (hugo.yml is the only Pages publisher)
```

### Publishing plane
- **Generator:** Hugo extended 0.164.0 + Blowfish v2.105.0 (git submodule).
- **Content:** `content/blog/`, `content/people/`, `content/domini/`,
  `content/knowledge-graph/`. Legacy permalinks preserved via Hugo `aliases`.
- **Comments:** giscus (GitHub Discussions backend). **Subscription:** Buttondown.
- **Search:** Blowfish + Fuse.js (`assets/lib/fuse/fuse.min.cjs`, `index.json`).
- **Output:** static HTML in `public/` (gitignored). Deployed to GitHub Pages.

### Engineering plane (independent)
- `src/` — ES modules. **Not imported by the static site.** Retained as R&D
  substrate (CRDT/P2P/DAO/BCI adapters per `docs/adr/0001-module-layering.md`).
- `contracts/dao/` — Solidity (GovernanceToken, SoulboundToken, ProposalEngine).
  Deployed separately via Hardhat (`deploy-dao.yml`, guarded by secrets).
- A Hugo failure never implies an engineering failure and vice-versa.

## Content Contract
- New posts in `content/blog/` MUST satisfy `schema/post-metadata.schema.json`.
  Enforced as a **hard gate** in `hugo.yml` via `scripts/ci-content-contract.cjs`
  (added=hard, modified=soft). Invalid new post blocks the deploy.
- Knowledge Graph (`static/data/knowledge-graph.json`, JSON-LD) is emitted for
  the whole corpus during the build.

## Removed (Phase 7)
The Jekyll + esbuild stack (`_config.yml`, `Gemfile`, `_layouts/`, `_includes/`,
`_sass/`, `_posts/`, `_site/`, `js/`, `build.js`, `build-jekyll.rb`), the Jekyll
CI workflows, and the `js/refactored-bundle.js` module path are gone. Do not
reintroduce `bundle exec jekyll build` — the site is Hugo-only.

## Notes
- `src/` dead code (`embedding-cache.js`) was removed in the cleanup phase;
  `embedding-cache-service.js` remains (used by `vector-search-service.js`).
- Browser-runtime JS is provided by Blowfish's own bundle + `assets/lib/fuse`.
  No hand-rolled `js/*.js` fallback exists anymore.
