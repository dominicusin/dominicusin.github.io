/**
 * Optimized Performance Monitor - Refactored for efficiency
 * Core Web Vitals tracking and performance optimization
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigation: null,
            resources: [],
            vitals: {}
        };
        
        this.config = {
            analyticsEndpoint: '/api/analytics',
            slowResourceThreshold: 1000,
            enableAnalytics: true,
            debugMode: false
        };
        
        this.init();
    }
    
    init() {
        this.trackNavigation();
        this.trackWebVitals();
        this.trackResources();
        this.setupErrorHandling();
    }
    
    trackNavigation() {
        if (!('performance' in window) || !('getEntriesByType' in performance)) return;
        
        this.metrics.navigation = performance.getEntriesByType('navigation')[0];
        this.calculatePageMetrics();
    }
    
    calculatePageMetrics() {
        if (!this.metrics.navigation) return;
        
        const { navigation } = this.metrics;
        const metrics = {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: 0,
            firstContentfulPaint: 0
        };
        
        // Get paint timing if available
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                metrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime;
            }
        });
        
        this.logMetrics(metrics);
        this.sendToAnalytics('page_load', {
            ...metrics,
            page: window.location.pathname
        });
    }
    
    trackWebVitals() {
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
    }
    
    trackLCP() {
        if (!('PerformanceObserver' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
            
            this.logVital('LCP', this.metrics.vitals.lcp);
            this.sendToAnalytics('lcp', { value: this.metrics.vitals.lcp });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
    
    trackFID() {
        if (!('PerformanceObserver' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.metrics.vitals.fid = entry.processingStart - entry.startTime;
                this.logVital('FID', this.metrics.vitals.fid);
                this.sendToAnalytics('fid', { value: this.metrics.vitals.fid });
            });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
    }
    
    trackCLS() {
        if (!('PerformanceObserver' in window)) return;
        
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.metrics.vitals.cls = clsValue;
                }
            });
            
            this.logVital('CLS', clsValue);
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
    }
    
    trackResources() {
        if (!('PerformanceObserver' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            this.metrics.resources.push(...entries);
            this.analyzeSlowResources(entries);
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
    
    analyzeSlowResources(entries) {
        entries.forEach(entry => {
            if (entry.duration > this.config.slowResourceThreshold) {
                console.warn(`Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
                this.sendToAnalytics('slow_resource', {
                    name: entry.name,
                    duration: Math.round(entry.duration),
                    type: entry.initiatorType
                });
            }
        });
    }
    
    setupErrorHandling() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            this.sendToAnalytics('js_error', {
                message: event.error.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error.stack?.substring(0, 500)
            });
        });
        
        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.sendToAnalytics('promise_rejection', {
                reason: event.reason?.toString?.() || event.reason
            });
        });
    }
    
    logMetrics(metrics) {
        if (!this.config.debugMode) return;
        
        console.group('Page Performance Metrics');
        Object.entries(metrics).forEach(([key, value]) => {
            console.log(`${key}: ${Math.round(value)}ms`);
        });
        console.groupEnd();
    }
    
    logVital(name, value) {
        if (!this.config.debugMode) return;
        
        console.log(`${name}: ${Math.round(value)}${name === 'CLS' ? '' : 'ms'}`);
    }
    
    sendToAnalytics(metric, data) {
        if (!this.config.enableAnalytics) return;
        
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', metric, {
                custom_parameter: data,
                event_category: 'performance',
                value: typeof data.value === 'number' ? Math.round(data.value) : undefined
            });
        }
        
        // Custom analytics with sendBeacon
        if (navigator.sendBeacon) {
            const analyticsData = {
                metric,
                data,
                url: window.location.href,
                timestamp: Date.now(),
                userAgent: navigator.userAgent.substring(0, 200)
            };
            
            try {
                navigator.sendBeacon(this.config.analyticsEndpoint, JSON.stringify(analyticsData));
            } catch (e) {
                // Silently fail
            }
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    getCoreWebVitals() {
        return this.metrics.vitals;
    }
    
    setConfig(options) {
        Object.assign(this.config, options);
    }
}

// Optimized Module Loader
class ModuleLoader {
    constructor() {
        this.cache = {
            loaded: new Set(),
            loading: new Map(),
            failed: new Set()
        };
        
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000
        };
    }
    
    async loadModule(name, path) {
        // Return if already loaded
        if (this.cache.loaded.has(name)) {
            return Promise.resolve();
        }
        
        // Return existing promise if loading
        if (this.cache.loading.has(name)) {
            return this.cache.loading.get(name);
        }
        
        // Check if previously failed
        if (this.cache.failed.has(name)) {
            return Promise.reject(new Error(`Module ${name} previously failed to load`));
        }
        
        // Start loading
        const promise = this.loadScriptWithRetry(name, path);
        this.cache.loading.set(name, promise);
        
        return promise
            .then(() => {
                this.cache.loaded.add(name);
                this.cache.loading.delete(name);
            })
            .catch(error => {
                this.cache.failed.add(name);
                this.cache.loading.delete(name);
                console.error(`Failed to load module ${name}:`, error);
                throw error;
            });
    }
    
    async loadScriptWithRetry(name, path, attempt = 1) {
        try {
            await this.loadScript(path);
        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempt);
                return this.loadScriptWithRetry(name, path, attempt + 1);
            }
            throw error;
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            
            // Timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Script load timeout: ${src}`));
            }, this.config.timeout);
            
            script.addEventListener('load', () => clearTimeout(timeout));
            script.addEventListener('error', () => clearTimeout(timeout));
            
            document.head.appendChild(script);
        });
    }
    
    async loadConditionalModule(condition, name, path) {
        if (!condition) return Promise.resolve();
        return this.loadModule(name, path);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    clearCache() {
        this.cache.loaded.clear();
        this.cache.loading.clear();
        this.cache.failed.clear();
    }
}

// Font Loading Optimizer
class FontOptimizer {
    constructor() {
        this.state = {
            fontsLoaded: false,
            fallbackUsed: false
        };
        
        this.config = {
            testFont: 'Inter',
            testText: 'mmmmmmmmmmlli',
            fallbackTimeout: 3000
        };
        
        this.init();
    }
    
    init() {
        this.setupFontLoading();
        this.preventFOIT();
    }
    
    setupFontLoading() {
        if (document.fonts) {
            document.fonts.ready.then(() => {
                this.onFontsLoaded();
            });
        } else {
            this.checkFontsFallback();
        }
    }
    
    preventFOIT() {
        document.documentElement.classList.add('fonts-loading');
        
        setTimeout(() => {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-fallback');
            this.state.fallbackUsed = true;
        }, this.config.fallbackTimeout);
    }
    
    onFontsLoaded() {
        this.state.fontsLoaded = true;
        document.documentElement.classList.remove('fonts-loading', 'fonts-fallback');
        document.documentElement.classList.add('fonts-loaded');
    }
    
    checkFontsFallback() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Test with default font
        context.font = '72px monospace';
        const defaultWidth = context.measureText(this.config.testText).width;
        
        // Test with custom font
        context.font = `72px '${this.config.testFont}', monospace`;
        const customWidth = context.measureText(this.config.testText).width;
        
        if (defaultWidth !== customWidth) {
            setTimeout(() => this.onFontsLoaded(), 100);
        }
    }
    
    getStatus() {
        return this.state;
    }
}

// Initialize and export
document.addEventListener('DOMContentLoaded', () => {
    const performanceMonitor = new PerformanceMonitor();
    const moduleLoader = new ModuleLoader();
    const fontOptimizer = new FontOptimizer();
    
    // Load critical modules
    moduleLoader.loadModule('i18n', '/js/i18n.js');
    
    // Load non-critical modules after page load
    window.addEventListener('load', () => {
        const conditions = {
            interactive: document.querySelector('.hero, .post-card, .topic-card'),
            search: document.querySelector('[data-search]'),
            analytics: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        };
        
        // Load modules based on conditions
        moduleLoader.loadConditionalModule(conditions.interactive, 'interactive', '/js/interactive.js');
        moduleLoader.loadConditionalModule(conditions.search, 'search', '/js/search.js');
        moduleLoader.loadConditionalModule(conditions.analytics, 'analytics', '/js/analytics.js');
    });
    
    // Performance optimizations
    setupScrollOptimization();
    setupResizeOptimization();
    
    // Export for global access
    window.performanceMonitor = performanceMonitor;
    window.moduleLoader = moduleLoader;
    window.fontOptimizer = fontOptimizer;
});

// Performance optimization functions
function setupScrollOptimization() {
    let ticking = false;
    
    function updateScrollPosition() {
        ticking = false;
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

function setupResizeOptimization() {
    let timeout;
    
    window.addEventListener('resize', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            document.body.classList.add('resizing');
            requestAnimationFrame(() => {
                document.body.classList.remove('resizing');
            });
        }, 150);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceMonitor,
        ModuleLoader,
        FontOptimizer
    };
}