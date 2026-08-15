/**
 * Advanced Analytics System for Engineering Blog
 * Features: Core Web Vitals, user behavior tracking, performance metrics
 */

class AnalyticsSystem {
    constructor(options = {}) {
        this.options = {
            endpoint: options.endpoint || '/api/analytics',
            trackWebVitals: true,
            trackUserBehavior: true,
            trackPerformance: true,
            debugMode: options.debugMode || false,
            sampleRate: options.sampleRate || 0.1, // 10% sample rate
            ...options
        };
        
        this.sessionId = this.generateSessionId();
        this.pageStartTime = Date.now();
        this.events = [];
        this.init();
    }
    
    /**
     * Initialize analytics system
     */
    init() {
        this.trackPageView();
        
        if (this.options.trackWebVitals) {
            this.trackCoreWebVitals();
        }
        
        if (this.options.trackUserBehavior) {
            this.trackUserInteractions();
        }
        
        if (this.options.trackPerformance) {
            this.trackPerformanceMetrics();
        }
        
        // Send events periodically
        setInterval(() => this.sendEvents(), 30000); // Send every 30 seconds
        
        // Send on page unload
        window.addEventListener('beforeunload', () => this.sendEvents());
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Check if should sample (for privacy/performance)
     */
    shouldSample() {
        return Math.random() < this.options.sampleRate;
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        const pageData = {
            type: 'pageview',
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            device: this.getDeviceInfo()
        };
        
        this.addEvent(pageData);
    }
    
    /**
     * Track Core Web Vitals
     */
    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.observeLCP();
        
        // First Input Delay (FID) / First Input
        this.observeFID();
        
        // Cumulative Layout Shift (CLS)
        this.observeCLS();
    }
    
    /**
     * Observe Largest Contentful Paint
     */
    observeLCP() {
        if (!window.PerformanceObserver) return;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.addEvent({
                type: 'webvital_lcp',
                value: lastEntry.startTime,
                url: lastEntry.url,
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
    
    /**
     * Observe First Input Delay
     */
    observeFID() {
        if (!window.PerformanceObserver) return;
        
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.addEvent({
                    type: 'webvital_fid',
                    value: entry.processingStart - entry.startTime,
                    inputType: entry.name,
                    timestamp: Date.now(),
                    sessionId: this.sessionId
                });
            });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
    }
    
    /**
     * Observe Cumulative Layout Shift
     */
    observeCLS() {
        if (!window.PerformanceObserver) return;
        
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            
            this.addEvent({
                type: 'webvital_cls',
                value: clsValue,
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
    }
    
    /**
     * Track user interactions
     */
    trackUserInteractions() {
        // Click tracking
        document.addEventListener('click', (e) => {
            if (this.shouldSample()) {
                this.addEvent({
                    type: 'click',
                    target: this.getElementSelector(e.target),
                    coordinates: { x: e.clientX, y: e.clientY },
                    timestamp: Date.now(),
                    sessionId: this.sessionId
                });
            }
        });
        
        // Scroll tracking (throttled)
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.shouldSample()) {
                    this.addEvent({
                        type: 'scroll',
                        depth: this.getScrollDepth(),
                        timestamp: Date.now(),
                        sessionId: this.sessionId
                    });
                }
            }, 1000);
        });
        
        // Form interactions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.addEvent({
                    type: 'form_submit',
                    form: this.getFormIdentifier(form),
                    timestamp: Date.now(),
                    sessionId: this.sessionId
                });
            }
        });
    }
    
    /**
     * Track performance metrics
     */
    trackPerformanceMetrics() {
        // Wait for page to fully load
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                
                this.addEvent({
                    type: 'performance',
                    metrics: {
                        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                        tcp: navigation.connectEnd - navigation.connectStart,
                        ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
                        ttfb: navigation.responseStart - navigation.requestStart,
                        download: navigation.responseEnd - navigation.responseStart,
                        domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
                        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        total: navigation.loadEventEnd - navigation.navigationStart
                    },
                    timestamp: Date.now(),
                    sessionId: this.sessionId
                });
            }, 0);
        });
        
        // Resource timing
        this.trackResourceTiming();
    }
    
    /**
     * Track resource loading performance
     */
    trackResourceTiming() {
        if (!window.PerformanceObserver) return;
        
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.addEvent({
                        type: 'resource',
                        name: entry.name,
                        type: this.getResourceType(entry.name),
                        size: entry.transferSize,
                        duration: entry.duration,
                        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
                        timestamp: Date.now(),
                        sessionId: this.sessionId
                    });
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
    
    /**
     * Get device information
     */
    getDeviceInfo() {
        return {
            type: this.getDeviceType(),
            os: this.getOperatingSystem(),
            browser: this.getBrowser(),
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack
        };
    }
    
    /**
     * Get device type
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    /**
     * Get operating system
     */
    getOperatingSystem() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('windows')) return 'Windows';
        if (userAgent.includes('mac')) return 'macOS';
        if (userAgent.includes('linux')) return 'Linux';
        if (userAgent.includes('android')) return 'Android';
        if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
        return 'Unknown';
    }
    
    /**
     * Get browser
     */
    getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }
    
    /**
     * Get CSS selector for element
     */
    getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        return element.tagName.toLowerCase();
    }
    
    /**
     * Get scroll depth
     */
    getScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / documentHeight) * 100);
    }
    
    /**
     * Get form identifier
     */
    getFormIdentifier(form) {
        if (form.id) return `#${form.id}`;
        if (form.className) return `form.${form.className.split(' ')[0]}`;
        if (form.action) return `form[${form.action}]`;
        return 'form';
    }
    
    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
        const scriptExtensions = ['js', 'mjs'];
        const styleExtensions = ['css', 'scss', 'sass'];
        
        if (imageExtensions.includes(extension)) return 'image';
        if (scriptExtensions.includes(extension)) return 'script';
        if (styleExtensions.includes(extension)) return 'stylesheet';
        if (extension === 'font' || extension === 'woff' || extension === 'woff2' || extension === 'ttf') return 'font';
        
        return 'other';
    }
    
    /**
     * Add event to queue
     */
    addEvent(event) {
        this.events.push(event);
        
        if (this.options.debugMode) {
            console.log('Analytics Event:', event);
        }
    }
    
    /**
     * Send events to server
     */
    async sendEvents() {
        if (this.events.length === 0) return;
        
        const eventsToSend = [...this.events];
        this.events = [];
        
        try {
            await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events: eventsToSend,
                    session: this.sessionId,
                    timestamp: Date.now()
                })
            });
            
            if (this.options.debugMode) {
                console.log(`Sent ${eventsToSend.length} analytics events`);
            }
        } catch (error) {
            // Re-queue events on failure
            this.events = [...eventsToSend, ...this.events];
            if (this.options.debugMode) {
                console.warn('Failed to send analytics events:', error);
            }
        }
    }
}

// Auto-initialize analytics system
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on production or if debug mode is enabled
    if (window.location.hostname === 'localhost' && !window.analyticsDebug) {
        return;
    }
    
    window.analyticsSystem = new AnalyticsSystem({
        endpoint: '/api/analytics',
        trackWebVitals: true,
        trackUserBehavior: true,
        trackPerformance: true,
        debugMode: window.analyticsDebug || false,
        sampleRate: 0.1 // 10% sample rate for privacy
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsSystem;
}