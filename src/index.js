/**
 * @fileoverview Application bootstrap - aggregates all ES modules.
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
import { I18nManager } from './modules/i18n.js';
import { ImageOptimizer } from './modules/image-optimizer.js';
import { SearchEngine } from './modules/search-engine.js';
import { SocialSharing } from './modules/social-sharing.js';
import { SubscriptionSystem } from './modules/subscription.js';
import { AnalyticsService } from './services/analytics-service.js';
import { PWAService } from './services/pwa-service.js';

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
  theme: null,
  i18n: null,
  imageOptimizer: null,
  searchEngine: null,
  socialSharing: null,
  subscription: null,
  analytics: null,
  pwa: null
};

/**
 * Initialise the application once the DOM is ready.
 * @returns {void}
 */
export function startApp() {
  if (typeof document === 'undefined') return; // SSR / non-DOM safe no-op
  
  // Initialize Theme Manager
  if (!App.theme) {
    App.theme = new ThemeManager({
      container: '.theme-toggle',
      onThemeChange: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        window.dispatchEvent(new CustomEvent(EVENT_NAMES.THEME_CHANGED, { detail: { theme } }));
      }
    });
    
    // Reflect initial theme on <html> for FOUC-free rendering
    document.documentElement.setAttribute('data-theme', App.theme.currentTheme);
  }
  
  // Initialize I18n Manager
  if (!App.i18n) {
    App.i18n = new I18nManager();
    window.i18n = App.i18n;
    window.t = (key, params) => App.i18n.t(key, params);
  }
  
  // Initialize Image Optimizer
  if (!App.imageOptimizer && document.querySelector('img[data-src], img[data-responsive]')) {
    App.imageOptimizer = new ImageOptimizer();
    window.imageOptimizer = App.imageOptimizer;
  }
  
  // Initialize Search Engine
  if (!App.searchEngine && document.querySelector('[data-search]')) {
    App.searchEngine = new SearchEngine();
    window.searchEngine = App.searchEngine;
  }
  
  // Initialize Social Sharing
  if (!App.socialSharing && document.querySelector('.social-sharing')) {
    App.socialSharing = new SocialSharing();
    window.socialSharing = App.socialSharing;
  }
  
  // Initialize Subscription System
  if (!App.subscription && document.querySelector('.subscription-container, .floating-subscription')) {
    App.subscription = new SubscriptionSystem({
      rssUrl: '/feed.xml',
      subscriptionEndpoint: '/api/subscribe',
      verificationEndpoint: '/api/verify-email',
      unsubscribeEndpoint: '/api/unsubscribe'
    });
    window.subscriptionSystem = App.subscription;
  }
  
  // Initialize Analytics Service (production only or debug mode)
  const shouldInitAnalytics = window.location.hostname !== 'localhost' || window.analyticsDebug === true;
  if (!App.analytics && shouldInitAnalytics) {
    App.analytics = new AnalyticsService({
      endpoint: '/api/analytics',
      trackWebVitals: true,
      trackUserBehavior: true,
      trackPerformance: true,
      debugMode: window.analyticsDebug || false,
      sampleRate: 0.1
    });
    App.analytics.init();
    window.analyticsService = App.analytics;
  }
  
  // Initialize PWA Service
  if (!App.pwa && 'serviceWorker' in navigator) {
    App.pwa = new PWAService({
      debugMode: window.pwaDebug || false
    });
    App.pwa.init().then(() => {
      window.pwaService = App.pwa;
    });
  }
  
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
