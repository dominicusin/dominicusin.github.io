# `src/services`

Cross-cutting runtime services (DOM/network/IndexedDB bound).

- `analytics-service.js` — Core Web Vitals, behavior + performance tracking,
  queue/flush with retry. Tested (`tests/unit/analytics-service.test.js`).
- `pwa-service.js` — service-worker registration + offline strategy.
- `rum-service.js` — Real User Monitoring aggregation.
- `prefetch.js`-adjacent prefetch service lives in `modules/`.
- `embedding-cache-service.js` — LRU + TTL embedding cache (in-memory).
  Tested (`tests/unit/embedding-cache-service.test.js`).
  **Note:** `embedding-cache.js` (v3.0) in this folder is DEAD CODE — imported
  by no module; superseded by `embedding-cache-service.js`.
- `vector-store.js` — IndexedDB persistence for vectors w/ in-memory fallback.
  Tested (`tests/unit/vector-store.test.js`).
- `vector-search-service.js` — service wrapper around `modules/vector-search`.
- `ai-i18n-service.js`, `vr-export-service.js` — AI/i18n + VR export helpers.

**Layer:** depends on config/utils/core. Some modules depend on these.
