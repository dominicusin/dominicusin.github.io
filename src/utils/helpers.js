/**
 * @fileoverview Utility functions and helpers
 * @module utils/helpers
 */

import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Debounce function - delays execution until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = DEFAULT_CONFIG.PERFORMANCE.THROTTLE_DELAY) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback with fallback
 * @param {Function} callback - Callback function
 * @returns {void}
 */
export function requestIdleCallback(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get nested object value by dot-notation key
 * @param {Object} obj - Object to get value from
 * @param {string} key - Dot-notation key (e.g., 'foo.bar.baz')
 * @returns {*} Value or null if not found
 */
export function getNestedValue(obj, key) {
  if (!obj || !key) return null;
  return key.split('.').reduce((current, keyPart) => {
    return current && current[keyPart] !== undefined ? current[keyPart] : null;
  }, obj);
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects to merge
 * @returns {Object} Merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 * @param {*} value - Value to check
 * @returns {boolean} True if object
 */
export function isObject(value) {
  return !!(value && typeof value === 'object' && !Array.isArray(value));
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const visibility = Math.min(1, Math.max(0, (rect.bottom - rect.top) / window.innerHeight));
  return visibility >= threshold;
}

/**
 * Smooth scroll to element
 * @param {Element} target - Target element
 * @param {Object} options - Scroll options
 */
export function smoothScrollTo(target, options = {}) {
  const {
    offset = DEFAULT_CONFIG.SCROLL.OFFSET,
    behavior = 'smooth'
  } = options;
  
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior
  });
}

/**
 * Load script dynamically
 * @param {string} src - Script source URL
 * @param {Object} options - Load options
 * @returns {Promise<void>}
 */
export function loadScript(src, options = {}) {
  const {
    async = true,
    type = 'text/javascript',
    timeout = DEFAULT_CONFIG.PERFORMANCE.REQUEST_TIMEOUT
  } = options;
  
  return new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.type = type;
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
    
    const onLoad = () => {
      cleanup();
      resolve();
    };
    
    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load script: ${src}`));
    };
    
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Script load timeout: ${src}`));
    }, timeout);
    
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    
    document.head.appendChild(script);
  });
}

/**
 * Load CSS dynamically
 * @param {string} href - CSS href URL
 * @returns {Promise<void>}
 */
export function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    link.addEventListener('load', resolve);
    link.addEventListener('error', () => reject(new Error(`Failed to load CSS: ${href}`)));
    
    document.head.appendChild(link);
  });
}

/**
 * Check browser feature support
 * @param {string} feature - Feature name
 * @returns {boolean} True if supported
 */
export function supports(feature) {
  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    cssCustomProperties: typeof CSS !== 'undefined' && CSS.supports?.('color', 'var(--test)'),
    promise: 'Promise' in window,
    fetch: 'fetch' in window,
    localStorage: 'localStorage' in window,
    sendBeacon: 'sendBeacon' in navigator,
    webAnimations: 'animate' in document.documentElement
  };
  
  return features[feature] ?? false;
}

/**
 * Get device information
 * @returns {Object} Device info
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent.substring(0, 200),
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    deviceMemory: navigator.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    }
  };
}

/**
 * Get element selector (CSS path)
 * @param {Element} element - DOM element
 * @returns {string} CSS selector string
 */
export function getElementSelector(element) {
  if (!element) return '';
  
  if (element.id) {
    return `#${element.id}`;
  }
  
  const parts = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    } else {
      if (current.className) {
        const classes = current.className.split(' ').filter(Boolean).slice(0, 2);
        if (classes.length) {
          selector += '.' + classes.join('.');
        }
      }
      
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          child => child.nodeName === current.nodeName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return parts.join(' > ');
}

/**
 * Format date for display
 * @param {string|Date} dateString - Date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(dateString, options = {}) {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse query parameters from URL
 * @param {string} url - URL to parse
 * @returns {Object} Query parameters object
 */
export function parseQueryParams(url = window.location.href) {
  const params = {};
  const queryString = url.split('?')[1];
  
  if (!queryString) return params;
  
  const pairs = queryString.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  
  return params;
}

/**
 * Create element with attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Attributes to set
 * @param {string|Element} content - Inner content
 * @returns {Element} Created element
 */
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (typeof value === 'boolean') {
      if (value) element.setAttribute(key, '');
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (typeof content === 'string') {
    element.innerHTML = content;
  } else if (content instanceof Element) {
    element.appendChild(content);
  }
  
  return element;
}
