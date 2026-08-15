# `src/modules`

Feature modules: each owns one responsibility and exposes a public class/function.

- `i18n.js` — translation loader/resolver (en/ru dictionaries under
  `assets/i18n/`).
- `theme-manager.js` — light/dark/auto theme with persistence + system
  preference sync.
- `search-engine.js` — Lunr.js full-text search over the post index.
- `search-ui.js` — search UI wiring (input, results, keyboard nav).
- `image-optimizer.js` — responsive WebP/AVIF srcset helpers.
- `social-sharing.js` — share-target wiring.
- `subscription.js` — newsletter/feed subscription with fallback.
- `prefetch.js` — **Vector D**: knowledge-graph-driven predictive prefetch
  (injectable `_doc`/`_fetch`, pure `_buildAdjacency`). Tested
  (`tests/unit/prefetch.test.js`).
- `vector-search.js` — **Vector C**: dependency-free TF-IDF cosine semantic
  search over the Content Model. Tested (`tests/unit/vector-search.test.js`).

### v4.0 "Autonomous & Semantic Web" additions (additive, isolated)
- `crdt-sync.js` — convergent CRDT (vector clocks + LWW). Tested (19).
- `graph-sync.js` — P2P replication over a transport bus. Tested.
- `webrtc-transport.js` — real WebRTC `DataChannel` transport. Tested.
- `bci-controller.js` — BCI neuro-control abstraction (intent decode). Tested.
- `eeg-adapter.js` — EEG WebSocket → `NeuroSample` adapter. Tested.

**Layer:** depends on config/utils/core/services via explicit interfaces.
