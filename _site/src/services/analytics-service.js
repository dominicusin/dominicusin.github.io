/**
 * @fileoverview Core Analytics Service - Refactored ES6 Module
 * @module services/analytics-service
 * @description Advanced analytics system with Core Web Vitals tracking,
 * user behavior analysis, and performance metrics
 */

import { LocalStorage } from '../utils/storage.js';
import { getDeviceInfo, getElementSelector, debounce } from '../utils/helpers.js';

/**
 * Analytics Service Configuration
 * @type {Object}
 */
const ANALYTICS_CONFIG = {
  endpoint: '/api/analytics',
  trackWebVitals: true,
  trackUserBehavior: true,
  trackPerformance: true,
  debugMode: false,
  sampleRate: 0.1, // 10% sample rate for privacy
  flushInterval: 30000, // Flush events every 30 seconds
  maxQueueSize: 100,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * AnalyticsService - Advanced analytics tracking system
 * @class
 */
export class AnalyticsService {
  /**
   * Create AnalyticsService instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = { ...ANALYTICS_CONFIG, ...options };
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();
    this.events = [];
    this.storage = new LocalStorage('analytics_session');
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.flushEvents = this.flushEvents.bind(this);
  }

  /**
   * Initialize analytics system
   * @returns {void}
   */
  init() {
    if (this.isInitialized) {
      console.warn('AnalyticsService already initialized');
      return;
    }

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

    // Setup periodic flush
    this.flushTimer = setInterval(this.flushEvents.bind(this), this.options.flushInterval);

    // Setup unload handler
    window.addEventListener('beforeunload', () => this.flushEvents());
    window.addEventListener('pagehide', () => this.flushEvents());

    this.isInitialized = true;
    this.log('AnalyticsService initialized', { sessionId: this.sessionId });
  }

  /**
   * Generate unique session ID
   * @returns {string} Unique session identifier
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Check if event should be sampled
   * @returns {boolean} True if event should be tracked
   */
  shouldSample() {
    return Math.random() < this.options.sampleRate;
  }

  /**
   * Track page view event
   * @returns {void}
   */
  trackPageView() {
    const pageData = {
      type: 'pageview',
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: getDeviceInfo()
    };

    this.addEvent(pageData);
  }

  /**
   * Track Core Web Vitals (LCP, FID, CLS, INP)
   * @returns {void}
   */
  trackCoreWebVitals() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeINP();
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   * @returns {void}
   */
  observeLCP() {
    if (!window.PerformanceObserver) return;

    let lcpValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.startTime;

      this.addEvent({
        type: 'webvital_lcp',
        value: lcpValue,
        url: lastEntry.url,
        rating: this.getLCPRating(lcpValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'], buffered: true });
  }

  /**
   * Get LCP rating based on thresholds
   * @param {number} value - LCP value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getLCPRating(value) {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Observe First Input Delay (FID)
   * @returns {void}
   */
  observeFID() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const fidValue = entry.processingStart - entry.startTime;
        
        this.addEvent({
          type: 'webvital_fid',
          value: fidValue,
          inputType: entry.name,
          rating: this.getFIDRating(fidValue),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      });
    });

    observer.observe({ entryTypes: ['first-input'], buffered: true });
  }

  /**
   * Get FID rating based on thresholds
   * @param {number} value - FID value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getFIDRating(value) {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   * @returns {void}
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
        rating: this.getCLSRating(clsValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });

    observer.observe({ entryTypes: ['layout-shift'], buffered: true });
    
    // Store CLS value for later retrieval
    this.clsValue = clsValue;
  }

  /**
   * Get CLS rating based on thresholds
   * @param {number} value - CLS value
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getCLSRating(value) {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Observe Interaction to Next Paint (INP)
   * @returns {void}
   */
  observeINP() {
    if (!window.PerformanceObserver) return;

    let inpValue = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const duration = entry.duration;
        if (duration > inpValue) {
          inpValue = duration;
        }
      });

      this.addEvent({
        type: 'webvital_inp',
        value: inpValue,
        rating: this.getINPRating(inpValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });

    observer.observe({ entryTypes: ['event'], buffered: true });
  }

  /**
   * Get INP rating based on thresholds
   * @param {number} value - INP value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getINPRating(value) {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track user interactions (clicks, scrolls, form submissions)
   * @returns {void}
   */
  trackUserInteractions() {
    // Click tracking with sampling
    document.addEventListener('click', (e) => {
      if (this.shouldSample()) {
        this.addEvent({
          type: 'click',
          target: getElementSelector(e.target),
          coordinates: { x: e.clientX, y: e.clientY },
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    });

    // Scroll tracking with debounce
    const trackScroll = debounce(() => {
      if (this.shouldSample()) {
        this.addEvent({
          type: 'scroll',
          depth: this.getScrollDepth(),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    }, 1000);

    document.addEventListener('scroll', trackScroll, { passive: true });

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
   * @returns {void}
   */
  trackPerformanceMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        this.addEvent({
          type: 'performance',
          metrics: {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 
              ? navigation.connectEnd - navigation.secureConnectionStart 
              : 0,
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

    this.trackResourceTiming();
  }

  /**
   * Track resource loading performance
   * @returns {void}
   */
  trackResourceTiming() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          this.addEvent({
            type: 'resource',
            name: entry.name,
            resourceType: this.getResourceType(entry.name),
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
   * Get resource type from URL
   * @param {string} url - Resource URL
   * @returns {string} Resource type
   */
  getResourceType(url) {
    const extension = url.split('.').pop()?.toLowerCase();
    const typeMap = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'],
      script: ['js', 'mjs'],
      stylesheet: ['css', 'scss', 'sass'],
      font: ['woff', 'woff2', 'ttf', 'eot', 'otf'],
      video: ['mp4', 'webm', 'ogg'],
      audio: ['mp3', 'wav', 'aac']
    };

    for (const [type, extensions] of Object.entries(typeMap)) {
      if (extensions.includes(extension)) return type;
    }

    return 'other';
  }

  /**
   * Get scroll depth percentage
   * @returns {number} Scroll depth percentage (0-100)
   */
  getScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
  }

  /**
   * Get form identifier
   * @param {HTMLFormElement} form - Form element
   * @returns {string} Form identifier
   */
  getFormIdentifier(form) {
    if (form.id) return `#${form.id}`;
    if (form.className) return `form.${form.className.split(' ')[0]}`;
    if (form.action) return `form[${form.action}]`;
    return 'form';
  }

  /**
   * Add event to queue
   * @param {Object} event - Event data
   * @returns {void}
   */
  addEvent(event) {
    if (this.events.length >= this.options.maxQueueSize) {
      this.flushEvents();
    }

    this.events.push(event);

    if (this.options.debugMode) {
      this.log('Event added', event);
    }
  }

  /**
   * Flush events to server
   * @returns {Promise<void>}
   */
  async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.sendToServer(eventsToSend);
      this.log(`Flushed ${eventsToSend.length} events`);
    } catch (error) {
      // Re-queue events on failure
      this.events = [...eventsToSend, ...this.events];
      this.warn('Failed to flush events', error);
    }
  }

  /**
   * Send events to server with retry logic
   * @param {Array} events - Events to send
   * @returns {Promise<void>}
   */
  async sendToServer(events) {
    const payload = {
      events,
      session: this.sessionId,
      timestamp: Date.now(),
      version: '2.0.0'
    };

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return;
      } catch (error) {
        if (attempt === this.options.retryAttempts) throw error;
        await this.delay(this.options.retryDelay * attempt);
      }
    }
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {void}
   */
  log(message, data = null) {
    if (!this.options.debugMode) return;
    console.log(`[Analytics] ${message}`, data || '');
  }

  /**
   * Warning logging
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   * @returns {void}
   */
  warn(message, data = null) {
    if (!this.options.debugMode) return;
    console.warn(`[Analytics] ${message}`, data || '');
  }

  /**
   * Get current session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Get queued events count
   * @returns {number} Number of queued events
   */
  getQueuedEventsCount() {
    return this.events.length;
  }

  /**
   * Destroy analytics service and cleanup
   * @returns {void}
   */
  destroy() {
    this.flushEvents();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.events = [];
    this.isInitialized = false;
  }
}

// Auto-initialization guard
const shouldInitializeAnalytics = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  const isDebugEnabled = window.analyticsDebug === true;
  
  return !isLocalhost || isDebugEnabled;
};

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (shouldInitializeAnalytics()) {
      window.analyticsService = new AnalyticsService({
        endpoint: '/api/analytics',
        trackWebVitals: true,
        trackUserBehavior: true,
        trackPerformance: true,
        debugMode: window.analyticsDebug || false,
        sampleRate: 0.1
      });
      
      window.analyticsService.init();
    }
  });
}

// Export for module usage
export default AnalyticsService;
