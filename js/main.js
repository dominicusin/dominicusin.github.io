/**
 * Main JavaScript loader and performance monitoring
 * Handles async loading of modules and performance tracking
 */

'use strict';

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: null,
      resources: [],
      vitals: {}
    };
    
    this.init();
  }

  init() {
    // Navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.metrics.navigation = performance.getEntriesByType('navigation')[0];
      this.trackPageLoad();
    }

    // Core Web Vitals
    this.trackWebVitals();
    
    // Resource timing
    this.trackResources();
  }

  trackPageLoad() {
    if (!this.metrics.navigation) return;
    
    const loadTime = this.metrics.navigation.loadEventEnd - this.metrics.navigation.loadEventStart;
    const domReady = this.metrics.navigation.domContentLoadedEventEnd - this.metrics.navigation.domContentLoadedEventStart;
    
    console.log(`Page load time: ${loadTime}ms`);
    console.log(`DOM ready time: ${domReady}ms`);
    
    // Send to analytics if available
    this.sendToAnalytics('page_load', {
      loadTime,
      domReady,
      page: window.location.pathname
    });
  }

  trackWebVitals() {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        console.log(`LCP: ${this.metrics.vitals.lcp}ms`);
        this.sendToAnalytics('lcp', { value: this.metrics.vitals.lcp });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // FID (First Input Delay)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.vitals.fid = entry.processingStart - entry.startTime;
          console.log(`FID: ${this.metrics.vitals.fid}ms`);
          this.sendToAnalytics('fid', { value: this.metrics.vitals.fid });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    }

    // CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.vitals.cls = clsValue;
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  trackResources() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.metrics.resources = this.metrics.resources.concat(entries);
        
        // Track slow resources
        entries.forEach(entry => {
          if (entry.duration > 1000) {
            console.warn(`Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  sendToAnalytics(metric, data) {
    // Send to Google Analytics 4 if available
    if (typeof gtag !== 'undefined') {
      gtag('event', metric, {
        custom_parameter: data,
        event_category: 'performance',
        value: typeof data.value === 'number' ? Math.round(data.value) : undefined
      });
    }
    
    // Send to custom analytics endpoint
    if (navigator.sendBeacon) {
      const analyticsData = {
        metric,
        data,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 200) // Limit length
      };
      
      try {
        navigator.sendBeacon('/api/analytics', JSON.stringify(analyticsData));
      } catch (e) {
        // Silently fail
      }
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

// Module loader class
class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
  }

  async loadModule(name, path) {
    if (this.loadedModules.has(name)) {
      return;
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const promise = this.loadScript(path).then(() => {
      this.loadedModules.add(name);
      this.loadingPromises.delete(name);
    }).catch(error => {
      console.error(`Failed to load module ${name}:`, error);
      this.loadingPromises.delete(name);
    });

    this.loadingPromises.set(name, promise);
    return promise;
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadConditionalModule(condition, name, path) {
    if (!condition) return;
    return this.loadModule(name, path);
  }
}

// Font loading optimization
class FontOptimizer {
  constructor() {
    this.fontsLoaded = false;
    this.init();
  }

  init() {
    // Check if fonts are already loaded
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.onFontsLoaded();
      });
    } else {
      // Fallback for older browsers
      this.checkFontsFallback();
    }

    // Prevent FOIT
    this.preventFOIT();
  }

  preventFOIT() {
    // Add font-loading class to hide text until fonts load
    document.documentElement.classList.add('fonts-loading');
    
    // Fallback timeout
    setTimeout(() => {
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-fallback');
    }, 3000);
  }

  onFontsLoaded() {
    this.fontsLoaded = true;
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
  }

  checkFontsFallback() {
    const testFont = 'Inter';
    const testText = 'mmmmmmmmmmlli';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Test with default font
    context.font = '72px monospace';
    const defaultWidth = context.measureText(testText).width;
    
    // Test with custom font
    context.font = `72px '${testFont}', monospace`;
    const customWidth = context.measureText(testText).width;
    
    if (defaultWidth !== customWidth) {
      setTimeout(() => this.onFontsLoaded(), 100);
    }
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Initialize module loader
const moduleLoader = new ModuleLoader();

// Initialize font optimizer
const fontOptimizer = new FontOptimizer();

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  // Load critical modules immediately
  moduleLoader.loadModule('i18n', '/js/i18n.js');
  
  // Load non-critical modules after page load
  window.addEventListener('load', () => {
    // Load interactive components only if needed
    const needsInteractive = document.querySelector('.hero, .post-card, .topic-card');
    if (needsInteractive) {
      moduleLoader.loadModule('interactive', '/js/interactive.js');
    }
    
    // Load search module if search is present
    const hasSearch = document.querySelector('[data-search]');
    if (hasSearch) {
      moduleLoader.loadModule('search', '/js/search.js');
    }
    
    // Load analytics only in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      moduleLoader.loadModule('analytics', '/js/analytics.js');
    }
  });

  // Optimize scrolling performance
  optimizeScrolling();
  
  // Optimize resize events
  optimizeResize();
});

// Optimize scrolling performance
function optimizeScrolling() {
  let ticking = false;
  
  function updateScrollPosition() {
    ticking = false;
    // Handle scroll-based animations
    requestAnimationFrame(() => {
      document.body.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }, { passive: true });
}

// Optimize resize events
function optimizeResize() {
  let timeout;
  
  window.addEventListener('resize', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Handle resize-based updates
      document.body.classList.add('resizing');
      requestAnimationFrame(() => {
        document.body.classList.remove('resizing');
      });
    }, 150);
  });
}

// Export for global access
window.performanceMonitor = performanceMonitor;
window.moduleLoader = moduleLoader;
window.fontOptimizer = fontOptimizer;

// Error boundary
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);
  
  // Send to analytics
  performanceMonitor.sendToAnalytics('js_error', {
    message: event.error.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error.stack?.substring(0, 500) // Limit stack trace
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  performanceMonitor.sendToAnalytics('promise_rejection', {
    reason: event.reason?.toString?.() || event.reason
  });
});