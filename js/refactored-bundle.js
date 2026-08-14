/**
 * @fileoverview Application bootstrap - aggregates refactored ES modules.
 * This is the single entry point bundled into `js/refactored-bundle.js`.
 * @module index
 */

import { DEFAULT_CONFIG, CSS_CLASSES, ARIA_LABELS, EVENT_NAMES } from './config/constants.js';
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
import { LocalStorage, SessionStorage, themeStorage, languageStorage } from './utils/storage.js';
import { ThemeManager } from './core/theme-manager.js';

/**
 * Central application registry.
 * Exposes the public API used by the rest of the site.
 * @type {Object}
 */
export const App = {
  config: DEFAULT_CONFIG,
  cssClasses: CSS_CLASSES,
  ariaLabels: ARIA_LABELS,
  events: EVENT_NAMES,
  helpers: {
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
  },
  storage: {
    LocalStorage,
    SessionStorage,
    theme: themeStorage,
    language: languageStorage
  },
  theme: null
};

/**
 * Initialise the application once the DOM is ready.
 * @returns {void}
 */
export function startApp() {
  if (typeof document === 'undefined') return; // SSR / non-DOM safe no-op
  if (App.theme) return; // guard against double init

  App.theme = new ThemeManager({
    container: '.theme-toggle',
    onThemeChange: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      window.dispatchEvent(new CustomEvent(EVENT_NAMES.THEME_CHANGED, { detail: { theme } }));
    }
  });

  // Reflect initial theme on <html> for FOUC-free rendering
  document.documentElement.setAttribute('data-theme', App.theme.currentTheme);

  // Expose for debugging / legacy interop
  window.App = App;
  window.dispatchEvent(new CustomEvent(EVENT_NAMES.MODULE_LOADED, { detail: { module: 'app' } }));
}

/**
 * Auto-start when DOM is ready (module scripts are deferred by default).
 */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp, { once: true });
  } else {
    startApp();
  }
}

export default App;
