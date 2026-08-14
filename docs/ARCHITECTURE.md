# Engineering Blog - JavaScript Architecture Documentation

## Overview

This document describes the refactored, modularized JavaScript architecture for the Engineering Blog project. The codebase has been reorganized following modern ES6+ module patterns with a focus on maintainability, testability, and performance.

## Directory Structure

```
/workspace/
├── src/                      # Source code (modularized)
│   ├── config/               # Configuration and constants
│   │   └── constants.js      # App-wide constants
│   ├── core/                 # Core modules
│   │   └── theme-manager.js  # Theme management system
│   ├── modules/              # Feature modules
│   ├── utils/                # Utility functions
│   │   ├── helpers.js        # General utilities
│   │   └── storage.js        # Storage wrappers
│   └── index.js              # Main entry point
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   │   └── helpers.test.js
│   ├── integration/          # Integration tests
│   └── test-utils.js         # Test utilities
├── docs/                     # Documentation
│   └── ARCHITECTURE.md       # This file
└── js/                       # Legacy JS (to be deprecated)
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
- localStorage persistence
- ARIA accessibility
- Keyboard navigation
- Analytics integration

## Testing

### Test Framework

Lightweight test framework in `tests/test-utils.js`:

```javascript
import { describe, it, expect, beforeEach } from './test-utils.js';

describe('MyModule', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Running Tests

```bash
# Browser-based (open test-runner.html)
# Or via Node.js with appropriate runner
npm test
```

### Test Coverage Goals

- **Utils**: 100% coverage
- **Core modules**: 90% coverage
- **Integration**: Critical paths only

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

### Importing in HTML

**Before:**
```html
<script src="/js/main.js"></script>
<script src="/js/theme-manager.js"></script>
```

**After:**
```html
<script type="module">
  import { ThemeManager } from '/src/core/theme-manager.js';
  // Auto-initialized or manual
</script>
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

1. TypeScript migration
2. Service Worker integration
3. Web Components for UI elements
4. Build process with Rollup/Vite
5. Automated performance testing
6. CI/CD pipeline integration

## Contributing

1. Create feature branch
2. Write tests
3. Follow existing patterns
4. Update documentation
5. Submit PR

---

*Last updated: 2024*
*Version: 2.0.0*
