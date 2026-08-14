# `src/utils`

Framework-free helper utilities. Pure where possible; no DOM-dependent globals.

- `helpers.js` — `debounce`, `throttle`, `generateId`, `getNestedValue`,
  `deepMerge`, `isObject`, `escapeHTML`, `formatDate`, `parseQueryParams`,
  `createElement`, `requestIdleCallback`, `loadScript`/`loadCSS`,
  `getDeviceInfo`, `getElementSelector`, `isInViewport`, `smoothScrollTo`.
  Fully unit-tested (`tests/unit/helpers.test.js`).
- `storage.js` — `LocalStorage` / `SessionStorage` safe wrappers with an
  in-memory fallback when `localStorage`/`sessionStorage` is unavailable.
  Tested (`tests/unit/storage.test.js`), including the fallback branch.

**Layer:** depends only on `config`.
