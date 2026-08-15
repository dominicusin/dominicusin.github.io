# Engineering Blog - AI Assistant Instructions

> **Priority order (per `docs/DEEP_REFACTORING_PLAN.md` §0):** repo instructions
> (`AGENTS.md`, `docs/*.md`) WIN over the attached external plan. Read
> `docs/DEEP_REFACTORING_PLAN.md` and `docs/ARCHITECTURE.md` before any step.
> Consolidate — do not duplicate.

## Overview
Jekyll-based engineering blog (GitHub Pages) with a modern ES-module frontend
bundled by **esbuild** into `js/refactored-bundle.js`, PWA, Lunr.js search,
and an AI-agent content pipeline. The single source of truth for post metadata
is the **Content Model** (`schema/post-metadata.schema.json`), enforced in CI.

## Architecture (current, authoritative)
```
src/                       # ES6 modules (bundled by esbuild)
├── config/constants.js
├── core/theme-manager.js
├── modules/  (i18n, image-optimizer, search-engine, social-sharing, subscription)
├── services/ (analytics-service, pwa-service)
├── utils/    (helpers, storage)
└── index.js  # entry: bootstraps all modules, wired as type=module in _layouts/default.html

js/refactored-bundle.js   # production bundle (esbuild, minified ~15KB gzipped)
tests/                    # 179 Jest (jsdom) + 17 smoke; see docs/TESTING.md
schema/post-metadata.schema.json   # formal Content Model (JSON Schema draft-07)
scripts/                  # validate-frontmatter, ai-review, build-knowledge-graph, ci-content-contract
docs/  (ARCHITECTURE, TESTING, CONTENT_CONTRACT, DEEP_REFACTORING_PLAN)
```
Legacy `js/*.js` files may still exist on disk but the shipped bundle is the
esbuild output. Do not edit `js/*.js` expecting it to ship.

## CI contract (Vector A — Agent-driven Publishing Protocol)
Job `📜 Content Model Contract` in `.github/workflows/ci-cd.yml`:
- **Hard gate:** changed `_posts/*.md` MUST satisfy `schema/post-metadata.schema.json`
  (run `node scripts/validate-frontmatter.cjs <file>`). Legacy posts are exempt
  (not re-validated on unrelated commits).
- **Soft gate:** `scripts/ai-review.cjs` on changed posts (reported, non-fatal).
- **Emit:** `assets/data/knowledge-graph.json` (JSON-LD) for Vector Search / KG.
See `docs/CONTENT_CONTRACT.md`. Run `node scripts/ci-content-contract.cjs` locally
to simulate the gate.

## Local workflow
```bash
npm ci                 # install (lockfile must match package.json)
npm run lint          # eslint src/ tests/
npm test              # smoke (17) + jest (179)
npm run build:production   # esbuild -> js/refactored-bundle.js
```
CI runs `npm ci` then the Jekyll pipeline; `npm ci` FAILS if lock is out of sync
— regenerate `package-lock.json` via `npm install` after editing `package.json`.

## Gotchas (learned)
- `node_modules/` is gitignored (never committed); `npm ci` rebuilds it in CI.
- `jest-environment-jsdom` must stay `^29.7.0` (matches jest 29 + lockfile).
- Actions `upload-artifact@v3` is hard-blocked by GitHub — use `@v4`.
- Edited source under `src/` must be re-bundled (`npm run build:production`) or
  the deployed site won't reflect changes.

## Legacy notes (superseded)
Older docs described a `js/*.js` + `css/*.min.css` + Jekyll 3.10.0 layout with a
~238KB bundle. That layout is replaced by the `src/` + esbuild pipeline above.
