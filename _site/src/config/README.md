# `src/config`

Build-time and runtime configuration constants shared across the app.

- `constants.js` — single source of truth for timeouts, debounce/throttle
  delays, storage keys, theme/scroll options, feature flags. Imported by
  utils/core/services; depends on nothing.
- `features.js` — (if present) central enable/disable switches for optional
  modules (PWA, analytics, subscription, social-sharing) so `index.js` can
  toggle behavior without edits.

**Layer:** bottom of the dependency graph (`config → utils → core → services →
modules → index`). No upward imports.
