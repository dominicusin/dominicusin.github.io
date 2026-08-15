# src

Engineering substrate — the **Engineering Plane** (kept separate from the Hugo
publishing pipeline; see `docs/adr/0002-two-plane-architecture.md`). These
modules are the reusable research/tooling layer (DAO clients, P2P/CRDT
experiments, vector search, analytics, etc.).

## Layout (high level)

- `src/services/` — runtime services (e.g. `vector-search-service.js`,
  `rum-service.js`, `pwa-service.js`).
- `src/workers/` — Web Workers for off-main-thread work.
- `src/**` — domain modules (DAO, decentralized web, data tooling).

## Working with it

```bash
npm run lint          # eslint over src/ + scripts/
npm run test:src      # jest unit tests for src/ + scripts/
npm run coverage      # c8 coverage report
```

## Notes

- Hugo does **not** import `src/` at build time. The two planes integrate only
  through generated artifacts (`static/data/knowledge-graph.json`), static assets
  (`static/js/`), and demo pages.
- Some legacy modules are quarantined in jest config (accessibility, image
  optimizer, search-engine, vector-search-service) pending modernization — they
  are retained as engineering substrate, not shipped by the site.
- `embedding-cache.js` was removed as dead code (Phase 0 cleanup).
