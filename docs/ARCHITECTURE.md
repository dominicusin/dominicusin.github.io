# Engineering Blog - JavaScript Architecture Documentation

> **Status:** Modular architecture is **live**. `src/` ES modules are bundled by
> `build.js` (esbuild) into `js/refactored-bundle.js` and loaded via
> `<script type="module">` in `_layouts/default.html`. The legacy `js/*.js`
> files remain as a fallback for browsers without module support.

## Overview

The codebase is organized as modern ES6+ modules with a single entry point
(`src/index.js`) that aggregates config, utilities, core, feature modules, and
services into one tree-shaken bundle (`js/refactored-bundle.js`).

## Directory Structure

```
/workspace/
├── src/                      # Source code (modularized ES modules)
│   ├── config/               # Configuration and constants
│   │   └── constants.js      # Frozen app-wide constants
│   ├── core/                 # Core modules
│   │   └── theme-manager.js  # Theme management system
│   ├── modules/              # Feature modules
│   │   ├── i18n.js           # Internationalization
│   │   ├── image-optimizer.js# Responsive/WebP/lazy images
│   │   ├── search-engine.js   # Client-side search
│   │   ├── social-sharing.js  # Social share widgets
│   │   └── subscription.js    # Newsletter subscription
│   ├── services/             # Cross-cutting services
│   │   ├── analytics-service.js  # Analytics + Core Web Vitals
│   │   └── pwa-service.js        # Service worker / PWA
│   ├── utils/                # Utility functions
│   │   ├── helpers.js        # General utilities
│   │   └── storage.js        # Storage wrappers
│   └── index.js              # Main entry point (the "main" in package.json)
├── js/                      # Build output + legacy scripts
│   ├── refactored-bundle.js  # ← esbuild output (the new primary bundle)
│   └── *.js                  # Legacy scripts (fallback)
├── tests/                   # Test files
│   ├── run-tests.js          # Lightweight ESM smoke runner
│   ├── jest.setup.js         # jsdom polyfills for tests
│   ├── test-utils.js         # Jest globals shim for legacy tests
│   └── unit/                 # Jest unit tests (5 suites, 148 tests)
├── docs/ARCHITECTURE.md      # This file
└── build.js                  # Build + esbuild bundling step
```

## Module System

### ES6 Modules

All new code uses ES6 module syntax (`import`/`export`) for better:
- **Tree-shaking**: Unused code can be eliminated during bundling
- **Static analysis**: Dependencies are clear and analyzable
- **Scope isolation**: No global namespace pollution

### Example Import/Export

```javascript
// Export
export const CONSTANT = 'value';
export class MyClass {}
export function myFunction() {}

// Import
import { CONSTANT, MyClass, myFunction } from './module.js';
```

## Core Modules

### 1. Configuration (`src/config/constants.js`)

Centralized configuration with frozen objects to prevent mutation:

```javascript
export const DEFAULT_CONFIG = Object.freeze({
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100
  },
  STORAGE: {
    THEME: 'blog-theme',
    LANGUAGE: 'preferred-language'
  }
});
```

**Benefits:**
- Single source of truth
- Type safety through JSDoc
- Easy to override in tests

### 2. Utilities (`src/utils/`)

#### helpers.js

Common utility functions:

| Function | Description |
|----------|-------------|
| `debounce(fn, wait)` | Delays function execution |
| `throttle(fn, limit)` | Limits execution rate |
| `generateId(prefix)` | Creates unique IDs |
| `getNestedValue(obj, key)` | Gets dot-notation values |
| `deepMerge(target, ...sources)` | Deep object merge |
| `loadScript(src, options)` | Dynamic script loading |
| `formatDate(date, options)` | Date formatting |
| `escapeHTML(text)` | HTML escaping |

#### storage.js

Safe storage wrappers with fallbacks:

```javascript
import { LocalStorage, SessionStorage } from './utils/storage.js';

const storage = new LocalStorage('myapp');
storage.set('key', { data: 'value' });
const value = storage.get('key');
```

**Features:**
- Automatic JSON serialization
- Graceful degradation when storage unavailable
- Namespaced keys
- In-memory fallback

### 3. Core Components (`src/core/`)

#### ThemeManager

Handles theme switching with system preference detection:

```javascript
import { ThemeManager } from './core/theme-manager.js';

const manager = new ThemeManager({
  container: '.theme-toggle',
  defaultTheme: 'auto'
});

manager.setTheme('dark');
```

**Features:**
- Light/Dark/Auto themes
- System preference detection
- localStorage persistence (key `blog-theme`)
- ARIA accessibility
- Keyboard navigation
- Analytics integration

### 4. Feature Modules (`src/modules/`)

| Module | Responsibility |
|--------|----------------|
| `i18n.js` | Internationalisation: language switching, `data-i18n` key binding, `window.t()` helper |
| `image-optimizer.js` | Responsive `srcset`, WebP negotiation, IntersectionObserver lazy-loading, blur placeholders, error fallback |
| `search-engine.js` | Client-side JSON-index search: UI build, keyboard nav, result rendering, empty/error states |
| `social-sharing.js` | Share-button widgets (Twitter, Facebook, LinkedIn, copy-link) |
| `subscription.js` | Newsletter subscription widget with email verification flow |

### 5. Services (`src/services/`)

| Service | Responsibility |
|---------|----------------|
| `analytics-service.js` | Event queue with retry + sampling, Core Web Vitals (`web-vitals` shim), scroll depth, SPA-ready `track()` API |
| `pwa-service.js` | Service-worker registration, install/update banners, offline support |

All feature modules and services are instantiated by `startApp()` in `src/index.js`
each wrapped in `safeInit()` so one failing module never blocks the rest of the app.
Each module also keeps its own standalone `DOMContentLoaded` auto-init guarded by
`typeof document/window !== 'undefined'` for direct `<script>` usage.

## Testing

The project uses **two complementary test layers**:

### 1. Lightweight ESM smoke runner (`tests/run-tests.js`)
Runs in bare Node.js (no DOM) — perfect for CI `test` jobs and module-logic checks.
DOM-dependent assertions are skipped when `document` is undefined.

```bash
npm run test:smoke       # node tests/run-tests.js  (17 tests)
```

Covers: `helpers` (debounce, throttle, generateId, getNestedValue, deepMerge,
isObject, formatDate RU/EN, escapeHTML), `constants` (frozen config, CSS/ARIA/event
constants, web-vitals thresholds), `storage` (LocalStorage/SessionStorage with
in-memory fallback, namespacing), and `index` (`App` export shape + `startApp()`
safe no-op in non-DOM context).

### 2. Jest unit suites (`tests/unit/*.test.js`)
Full unit coverage in a jsdom browser environment with polyfills for
IntersectionObserver, matchMedia, fetch, requestIdleCallback, Image load events,
and `scrollIntoView`. Config: `jest.config.cjs` + `babel.config.cjs`.

```bash
npm run test:unit        # jest --config jest.config.cjs  (5 suites, 148 tests)
npm run test:coverage    # with coverage report
```

Suites: `helpers`, `storage`, `theme-manager`, `search-engine`,
`analytics-service`, `image-optimizer` — covering config merge, storage
persistence, theme switching + persistence, search UI/keyboard nav, analytics
queuing/retry, and responsive/lazy image loading.

### Run everything

```bash
npm test                 # = test:smoke && test:unit
```
## Performance Optimizations

### Implemented

1. **Debounced/throttled event handlers**
2. **Intersection Observer for lazy loading**
3. **RequestIdleCallback for non-critical work**
4. **Passive event listeners**
5. **CSS containment**
6. **Resource hints (preload, prefetch, preconnect)**

### Core Web Vitals

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | Preload hero images, optimize fonts |
| FID | < 100ms | Code splitting, web workers |
| CLS | < 0.1 | Reserve space, font-display: swap |

## Migration Guide

### From Legacy to Modular

**Before:**
```javascript
// js/main.js
var CONFIG = { delay: 300 };
function debounce(fn, wait) { ... }
```

**After:**
```javascript
// src/config/constants.js
export const DEFAULT_CONFIG = { 
  PERFORMANCE: { DEBOUNCE_DELAY: 300 }
};

// src/utils/helpers.js
export function debounce(fn, wait = DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY) { ... }
```

### Importing in HTML (current production setup)

`default.html` loads the bundled output as an ES module (primary path), with
legacy `js/*.js` kept for non-module browsers:

```html
<!-- Optimized Scripts -->
<script src="{{ "/js/main.js" | absolute_url }}" defer></script>
<script src="{{ "/js/performance-optimizer.js" | absolute_url }}" defer></script>
<script src="{{ "/js/pwa.js" | absolute_url }}" defer></script>
<script src="{{ "/js/i18n.js" | absolute_url }}" defer></script>

<!-- Refactored ES module bundle (primary, modern browsers) -->
<script type="module" src="{{ "/js/refactored-bundle.js" | absolute_url }}"></script>
```

The module auto-bootstraps on `DOMContentLoaded` via `startApp()` in `src/index.js`,
which instantiates **all** modules (ThemeManager, I18nManager, ImageOptimizer,
SearchEngine, SocialSharing, SubscriptionSystem, AnalyticsService, PWAService) —
each wrapped in `safeInit()` so a single module failure never breaks the page.
The `App` registry and every instance are exposed on `window.App`.

## Build & Bundling

`build.js` (ESM) runs during `npm run build` / `build:production`:

1. Cleans `dist/` and old artifacts.
2. In production: minifies legacy assets and **bundles `src/index.js` → `js/refactored-bundle.js`** via `esbuild` (tree-shaking + minify, ESM output).
3. In development: bundles unminified (with sourcemap) for debugging.
4. Falls back to a plain concatenation if `esbuild` is unavailable.

Run it:

```bash
npm run build            # development bundle
NODE_ENV=production npm run build   # minified + tree-shaken production bundle
```

## API Reference

### Constants

```javascript
import { 
  DEFAULT_CONFIG,    // Configuration
  CSS_CLASSES,       // Class name constants
  ARIA_LABELS,       // Accessibility labels
  EVENT_NAMES,       // Custom event names
  KEY_CODES,         // Keyboard codes
  WEB_VITALS_THRESHOLDS  // Performance thresholds
} from './config/constants.js';
```

### Utilities

```javascript
import {
  debounce,
  throttle,
  generateId,
  getNestedValue,
  deepMerge,
  isObject,
  isInViewport,
  smoothScrollTo,
  loadScript,
  loadCSS,
  supports,
  getDeviceInfo,
  formatDate,
  escapeHTML,
  parseQueryParams,
  createElement
} from './utils/helpers.js';
```

### Storage

```javascript
import {
  LocalStorage,
  SessionStorage,
  themeStorage,
  languageStorage,
  isLocalStorageAvailable,
  isSessionStorageAvailable
} from './utils/storage.js';
```

## Best Practices

### Code Style

1. **Use const/let**, never var
2. **Arrow functions** for callbacks
3. **Template literals** for strings
4. **Destructuring** for object access
5. **Async/await** over promises
6. **JSDoc comments** for public APIs

### Error Handling

```javascript
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Graceful degradation
}
```

### Performance

1. **Lazy load** non-critical modules
2. **Debounce** scroll/resize handlers
3. **Use passive listeners** where possible
4. **Avoid layout thrashing**
5. **Minimize DOM manipulation**

## Browser Support

- **Modern browsers** (ES6 modules)
- **Fallbacks** provided for:
  - localStorage → in-memory Map
  - IntersectionObserver → immediate load
  - requestIdleCallback → setTimeout(0)

## Future Improvements

1. TypeScript migration (add types to `src/`)
2. Visual regression tests
3. Add interaction/component tests for social-sharing, subscription, pwa services
4. Expand Jest coverage to the remaining modules (i18n, social-sharing, subscription, pwa-service) — currently 6 of 11 modules have dedicated suites
5. Bundle-size CI budget assertion on `js/refactored-bundle.js`

## Contributing

1. Create feature branch
2. Add/extend tests in `tests/run-tests.js` or `tests/unit/`
3. Run `npm test` and `npm run build` before pushing
4. Update documentation (`docs/ARCHITECTURE.md`)
5. Submit PR — CI (Jekyll CI/CD, Performance, Security, Analytics) must pass

---

*Last updated: 2026-08-14*
*Version: 2.0.0*
