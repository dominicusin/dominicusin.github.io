/**
 * @fileoverview Application-wide constants and configuration
 * @module config/constants
 */

/**
 * Default configuration options
 * @type {Object}
 */
export const DEFAULT_CONFIG = Object.freeze({
  // Performance settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    SCROLL_TIMEOUT: 150,
    LAZY_LOAD_THRESHOLD: 0.1,
    LAZY_LOAD_ROOT_MARGIN: '50px',
    PREFETCH_HOVER_DELAY: 100,
    SLOW_RESOURCE_THRESHOLD: 1000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 10000
  },

  // Animation settings
  ANIMATION: {
    DURATION: 300,
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)'
  },

  // Scroll settings
  SCROLL: {
    SMOOTH_DURATION: 800,
    OFFSET: 80,
    SHOW_BACK_TO_TOP: 300
  },

  // Storage keys
  STORAGE: {
    THEME: 'blog-theme',
    LANGUAGE: 'preferred-language'
  },

  // Supported languages
  LANGUAGES: ['en', 'ru'],
  DEFAULT_LANGUAGE: 'en',

  // Theme options
  THEMES: ['light', 'dark', 'auto'],
  DEFAULT_THEME: 'auto',

  // Analytics settings
  ANALYTICS: {
    SAMPLE_RATE: 0.1,
    SEND_INTERVAL: 30000,
    ENDPOINT: '/api/analytics'
  }
});

/**
 * CSS class names used throughout the application
 * @type {Object}
 */
export const CSS_CLASSES = Object.freeze({
  // Theme classes
  THEME_LIGHT: 'theme-light',
  THEME_DARK: 'theme-dark',
  
  // Font loading states
  FONTS_LOADING: 'fonts-loading',
  FONTS_LOADED: 'fonts-loaded',
  FONTS_FALLBACK: 'fonts-fallback',
  
  // UI states
  SCROLLED: 'scrolled',
  RESIZING: 'resizing',
  MENU_OPEN: 'menu-open',
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  LOADING: 'loading',
  ERROR: 'error',
  
  // Lazy loading
  LAZY_LOADING: 'lazy-loading',
  LAZY_LOADED: 'lazy-loaded',
  LAZY_ERROR: 'lazy-error',
  
  // Animations
  ANIMATE_ON_SCROLL: 'animate-on-scroll',
  ANIMATED: 'animated',
  NO_ANIMATIONS: 'no-animations'
});

/**
 * ARIA labels and accessibility constants
 * @type {Object}
 */
export const ARIA_LABELS = Object.freeze({
  CLOSE_MENU: 'Close menu',
  OPEN_MENU: 'Open menu',
  BACK_TO_TOP: 'Back to top',
  SEARCH: 'Search articles',
  CLEAR_SEARCH: 'Clear search',
  LANGUAGE_SELECTION: 'Language selection',
  THEME_SWITCHER: 'Theme switcher'
});

/**
 * Event names for custom events
 * @type {Object}
 */
export const EVENT_NAMES = Object.freeze({
  I18N_LOADED: 'i18n:loaded',
  I18N_LANGUAGE_CHANGED: 'i18n:languageChanged',
  THEME_CHANGED: 'theme:changed',
  SEARCH_PERFORMED: 'search:performed',
  MODULE_LOADED: 'module:loaded'
});

/**
 * Key codes for keyboard navigation
 * @type {Object}
 */
export const KEY_CODES = Object.freeze({
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight'
});

/**
 * Performance metric thresholds (Core Web Vitals)
 * @type {Object}
 */
export const WEB_VITALS_THRESHOLDS = Object.freeze({
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000
  },
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25
  }
});
