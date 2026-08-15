/**
 * Advanced Performance Optimization System
 * Features: Core Web Vitals optimization, resource loading, lazy loading, prefetching
 */

class PerformanceOptimizer {
    constructor(options = {}) {
        this.options = {
            enableLazyImages: true,
            enablePrefetching: true,
            enableResourceHints: true,
            enableIntersectionObserver: true,
            optimizeCoreWebVitals: true,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.observer = null;
        this.prefetchedLinks = new Set();
        this.init();
    }
    
    /**
     * Initialize performance optimizations
     */
    init() {
        if (this.options.enableLazyImages) {
            this.setupLazyImageLoading();
        }
        
        if (this.options.enablePrefetching) {
            this.setupIntelligentPrefetching();
        }
        
        if (this.options.enableResourceHints) {
            this.setupResourceHints();
        }
        
        if (this.options.optimizeCoreWebVitals) {
            this.optimizeCoreWebVitals();
        }
        
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Setup lazy image loading with Intersection Observer
     */
    setupLazyImageLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImagesImmediately();
            return;
        }
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observe all images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
            
            // Add placeholder styling
            this.addImagePlaceholder(img);
        });
    }
    
    /**
     * Load image
     */
    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        const sizes = img.dataset.sizes;
        
        // Create new image to preload
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            if (srcset) img.srcset = srcset;
            if (sizes) img.sizes = sizes;
            
            // Remove placeholder class
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // Remove data attributes
            delete img.dataset.src;
            delete img.dataset.srcset;
            delete img.dataset.sizes;
        };
        
        tempImg.onerror = () => {
            // Handle error
            img.classList.add('lazy-error');
            img.classList.remove('lazy-loading');
        };
        
        // Start loading
        if (srcset) {
            tempImg.srcset = srcset;
        }
        tempImg.src = src;
    }
    
    /**
     * Add image placeholder
     */
    addImagePlaceholder(img) {
        img.classList.add('lazy-loading');
        
        // Create blur placeholder if low-res image available
        if (img.dataset.placeholder) {
            img.style.backgroundImage = `url(${img.dataset.placeholder})`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center';
            img.style.backgroundColor = '#f0f0f0';
        }
    }
    
    /**
     * Fallback for browsers without Intersection Observer
     */
    loadAllImagesImmediately() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }
    
    /**
     * Setup intelligent prefetching
     */
    setupIntelligentPrefetching() {
        // Prefetch on hover with delay
        let hoverTimeout;
        
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (!link || this.isExternalLink(link)) return;
            
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                this.prefetchLink(link.href);
            }, 100); // 100ms delay
        });
        
        document.addEventListener('mouseout', () => {
            clearTimeout(hoverTimeout);
        });
        
        // Prefetch important links on page load
        this.prefetchImportantLinks();
        
        // Prefetch based on scroll position
        this.setupViewportPrefetching();
    }
    
    /**
     * Prefetch link
     */
    prefetchLink(href) {
        if (this.prefetchedLinks.has(href)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        
        this.prefetchedLinks.add(href);
        
        if (this.options.debugMode) {
            console.log(`Prefetched: ${href}`);
        }
    }
    
    /**
     * Prefetch important links
     */
    prefetchImportantLinks() {
        // Prefetch next/prev article links
        const importantLinks = document.querySelectorAll('a[rel="next"], a[rel="prev"], .post-navigation a');
        
        importantLinks.forEach(link => {
            this.prefetchLink(link.href);
        });
        
        // Prefetch main navigation links
        const navLinks = document.querySelectorAll('.site-nav a');
        navLinks.slice(0, 3).forEach(link => {
            this.prefetchLink(link.href);
        });
    }
    
    /**
     * Setup viewport-based prefetching
     */
    setupViewportPrefetching() {
        if (!('IntersectionObserver' in window)) return;
        
        const linkObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target.querySelector('a[href]');
                    if (link && !this.isExternalLink(link)) {
                        this.prefetchLink(link.href);
                        linkObserver.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '100% 0px'
        });
        
        // Observe post cards that are not in viewport
        document.querySelectorAll('.post-card, .post').forEach(post => {
            linkObserver.observe(post);
        });
    }
    
    /**
     * Setup resource hints
     */
    setupResourceHints() {
        // DNS prefetch for external domains
        const externalDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'www.google-analytics.com',
            'github.com'
        ];
        
        externalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
        
        // Preconnect for critical resources
        const preconnectDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];
        
        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = `https://${domain}`;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        // Preload critical resources
        this.preloadCriticalResources();
    }
    
    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/assets/fonts/inter-variable.woff2', as: 'font', type: 'font/woff2' },
            { href: '/assets/fonts/jetbrains-mono-variable.woff2', as: 'font', type: 'font/woff2' },
            { href: '/js/theme-manager.js', as: 'script' },
            { href: '/css/main.css', as: 'style' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.type) link.type = resource.type;
            if (resource.as === 'font') link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    /**
     * Optimize Core Web Vitals
     */
    optimizeCoreWebVitals() {
        // Optimize Largest Contentful Paint (LCP)
        this.optimizeLCP();
        
        // Optimize First Input Delay (FID)
        this.optimizeFID();
        
        // Optimize Cumulative Layout Shift (CLS)
        this.optimizeCLS();
    }
    
    /**
     * Optimize LCP
     */
    optimizeLCP() {
        // Ensure above-the-fold images have priority
        const heroImage = document.querySelector('.hero img, .post-header img');
        if (heroImage) {
            heroImage.loading = 'eager';
            heroImage.fetchPriority = 'high';
        }
        
        // Preload hero images
        const heroImages = document.querySelectorAll('.hero img');
        heroImages.forEach((img, index) => {
            if (index === 0) {
                img.loading = 'eager';
                img.fetchPriority = 'high';
            }
        });
        
        // Optimize font loading
        this.optimizeFontLoading();
    }
    
    /**
     * Optimize FID
     */
    optimizeFID() {
        // Defer non-critical JavaScript
        const scripts = document.querySelectorAll('script[defer]');
        
        // Add event listeners efficiently
        this.setupEfficientEventListeners();
        
        // Optimize main thread work
        this.requestIdleCallback(() => {
            this.loadDeferredResources();
        });
    }
    
    /**
     * Optimize CLS
     */
    optimizeCLS() {
        // Add font-display: swap to prevent layout shifts
        this.optimizeFontDisplay();
        
        // Reserve space for images and ads
        this.reserveSpaceForElements();
        
        // Minimize DOM manipulation during load
        this.batchDOMUpdates();
    }
    
    /**
     * Optimize font loading
     */
    optimizeFontLoading() {
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Inter';
                font-display: swap;
                src: url('/assets/fonts/inter-variable.woff2') format('woff2-variations'),
                     url('/assets/fonts/inter-variable.woff2') format('woff2');
            }
            @font-face {
                font-family: 'JetBrains Mono';
                font-display: swap;
                src: url('/assets/fonts/jetbrains-mono-variable.woff2') format('woff2-variations'),
                     url('/assets/fonts/jetbrains-mono-variable.woff2') format('woff2');
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Optimize font display
     */
    optimizeFontDisplay() {
        const existingStyles = Array.from(document.querySelectorAll('style'));
        
        existingStyles.forEach(styleElement => {
            if (styleElement.textContent.includes('@font-face')) {
                styleElement.textContent = styleElement.textContent.replace(
                    /@font-face[^}]+}/g,
                    match => match.includes('font-display') ? match : match.replace('{', '{ font-display: swap; ')
                );
            }
        });
    }
    
    /**
     * Reserve space for elements
     */
    reserveSpaceForElements() {
        // Reserve space for lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (img.dataset.width && img.dataset.height) {
                img.style.aspectRatio = `${img.dataset.width} / ${img.dataset.height}`;
            }
        });
    }
    
    /**
     * Batch DOM updates
     */
    batchDOMUpdates() {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            document.body.classList.add('performance-optimized');
        });
    }
    
    /**
     * Setup efficient event listeners
     */
    setupEfficientEventListeners() {
        // Use passive event listeners where possible
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
        
        // Debounce scroll events
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) {
                window.cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = window.requestAnimationFrame(() => {
                // Handle scroll-based optimizations
                this.handleScroll();
            });
        }, { passive: true });
    }
    
    /**
     * Handle scroll-based optimizations
     */
    handleScroll() {
        // Pause image loading when scrolling fast
        const scrollY = window.scrollY;
        const scrollSpeed = Math.abs(scrollY - (this.lastScrollY || 0));
        this.lastScrollY = scrollY;
        
        if (scrollSpeed > 100) {
            // Fast scroll - pause lazy loading
            this.pauseLazyLoading();
        } else {
            // Slow scroll - resume lazy loading
            this.resumeLazyLoading();
        }
    }
    
    /**
     * Request idle callback with fallback
     */
    requestIdleCallback(callback) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    }
    
    /**
     * Load deferred resources
     */
    loadDeferredResources() {
        // Load non-critical analytics
        if (typeof gtag !== 'undefined') {
            // Analytics already loaded
        } else {
            // Load analytics if available
            const analyticsScript = document.querySelector('script[src*="gtag"]');
            if (analyticsScript) {
                analyticsScript.src = analyticsScript.src;
            }
        }
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor Long Tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) { // Long task threshold
                        console.warn('Long task detected:', {
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime
                        });
                    }
                });
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        }
        
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.9) {
                    console.warn('High memory usage detected:', {
                        used: memory.usedJSHeapSize,
                        total: memory.totalJSHeapSize,
                        limit: memory.jsHeapSizeLimit
                    });
                }
            }, 10000); // Check every 10 seconds
        }
    }
    
    /**
     * Check if link is external
     */
    isExternalLink(link) {
        return link.hostname !== window.location.hostname;
    }
    
    /**
     * Pause lazy loading
     */
    pauseLazyLoading() {
        // Implementation for pausing lazy loading during fast scroll
        document.body.classList.add('lazy-loading-paused');
    }
    
    /**
     * Resume lazy loading
     */
    resumeLazyLoading() {
        // Implementation for resuming lazy loading
        document.body.classList.remove('lazy-loading-paused');
    }
}

// Auto-initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer({
        enableLazyImages: true,
        enablePrefetching: true,
        enableResourceHints: true,
        optimizeCoreWebVitals: true,
        debugMode: window.performanceDebug || false
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}