/**
 * @fileoverview Unit tests for AnalyticsService
 * @module tests/unit/analytics-service.test
 */

import { AnalyticsService } from '../../src/services/analytics-service.js';

// Mock dependencies
const mockLocalStorage = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
};

jest.mock('../../src/utils/storage.js', () => ({
  LocalStorage: jest.fn().mockImplementation(() => mockLocalStorage)
}));

describe('AnalyticsService', () => {
  let analytics;
  let originalFetch;
  let originalPerformanceObserver;

  beforeEach(() => {
    // Save originals
    originalFetch = global.fetch;
    originalPerformanceObserver = global.PerformanceObserver;

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200
    });

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));

    // Create instance with test config
    analytics = new AnalyticsService({
      endpoint: '/api/analytics',
      debugMode: true,
      sampleRate: 1.0, // Always sample in tests
      flushInterval: 1000,
      trackWebVitals: false,
      trackUserBehavior: false,
      trackPerformance: false
    });
  });

  afterEach(() => {
    // Restore originals
    global.fetch = originalFetch;
    global.PerformanceObserver = originalPerformanceObserver;

    // Cleanup
    if (analytics?.destroy) {
      analytics.destroy();
    }

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create instance with default config', () => {
      const service = new AnalyticsService();
      
      expect(service.options.endpoint).toBe('/api/analytics');
      expect(service.options.sampleRate).toBe(0.1);
      expect(service.options.flushInterval).toBe(30000);
    });

    test('should merge custom options', () => {
      const customOptions = {
        endpoint: '/custom-endpoint',
        sampleRate: 0.5,
        debugMode: true
      };

      const service = new AnalyticsService(customOptions);

      expect(service.options.endpoint).toBe('/custom-endpoint');
      expect(service.options.sampleRate).toBe(0.5);
      expect(service.options.debugMode).toBe(true);
    });

    test('should generate unique session ID', () => {
      const service1 = new AnalyticsService();
      const service2 = new AnalyticsService();

      expect(service1.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(service2.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(service1.sessionId).not.toBe(service2.sessionId);
    });
  });

  describe('init', () => {
    test('should initialize without errors', () => {
      expect(() => analytics.init()).not.toThrow();
    });

    test('should track page view on init', () => {
      const trackPageViewSpy = jest.spyOn(analytics, 'trackPageView');
      
      analytics.init();
      
      expect(trackPageViewSpy).toHaveBeenCalled();
    });

    test('should not double-initialize', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      analytics.init();
      analytics.init();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('AnalyticsService already initialized');
      
      consoleWarnSpy.mockRestore();
    });

    test('should setup flush timer', () => {
      jest.useFakeTimers();
      const flushEventsSpy = jest.spyOn(analytics, 'flushEvents');
      
      analytics.init();
      jest.advanceTimersByTime(1000);
      
      expect(flushEventsSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('generateSessionId', () => {
    test('should return valid session ID format', () => {
      const sessionId = analytics.generateSessionId();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    test('should include timestamp', () => {
      const before = Date.now();
      const sessionId = analytics.generateSessionId();
      const after = Date.now();
      
      const timestamp = parseInt(sessionId.split('_')[1]);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('shouldSample', () => {
    test('should always sample with rate 1.0', () => {
      analytics.options.sampleRate = 1.0;
      
      for (let i = 0; i < 100; i++) {
        expect(analytics.shouldSample()).toBe(true);
      }
    });

    test('should never sample with rate 0.0', () => {
      analytics.options.sampleRate = 0.0;
      
      for (let i = 0; i < 100; i++) {
        expect(analytics.shouldSample()).toBe(false);
      }
    });

    test('should sample approximately half with rate 0.5', () => {
      analytics.options.sampleRate = 0.5;
      
      let sampledCount = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        if (analytics.shouldSample()) sampledCount++;
      }
      
      // Allow 20% variance
      expect(sampledCount).toBeGreaterThan(iterations * 0.3);
      expect(sampledCount).toBeLessThan(iterations * 0.7);
    });
  });

  describe('trackPageView', () => {
    test('should add pageview event', () => {
      const addEventSpy = jest.spyOn(analytics, 'addEvent');
      
      analytics.trackPageView();
      
      expect(addEventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'pageview',
        url: expect.any(String),
        title: expect.any(String),
        sessionId: analytics.sessionId
      }));
    });

    test('should include viewport dimensions', () => {
      analytics.trackPageView();
      const event = analytics.events[analytics.events.length - 1];
      
      expect(event.viewport).toEqual({
        width: expect.any(Number),
        height: expect.any(Number)
      });
    });

    test('should include device info', () => {
      analytics.trackPageView();
      const event = analytics.events[analytics.events.length - 1];
      
      expect(event.device).toEqual(expect.objectContaining({
        userAgent: expect.any(String),
        language: expect.any(String)
      }));
    });
  });

  describe('addEvent', () => {
    test('should add event to queue', () => {
      const event = { type: 'test', data: 'value' };
      
      analytics.addEvent(event);
      
      expect(analytics.events).toContain(event);
    });

    test('should flush when queue reaches max size', () => {
      analytics.options.maxQueueSize = 5;
      const flushEventsSpy = jest.spyOn(analytics, 'flushEvents').mockImplementation();
      
      for (let i = 0; i < 6; i++) {
        analytics.addEvent({ type: 'test', index: i });
      }
      
      expect(flushEventsSpy).toHaveBeenCalled();
      
      flushEventsSpy.mockRestore();
    });

    test('should log in debug mode', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      analytics.options.debugMode = true;
      
      analytics.addEvent({ type: 'test' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('flushEvents', () => {
    test('should do nothing when queue is empty', async () => {
      await analytics.flushEvents();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should send events to server', async () => {
      analytics.addEvent({ type: 'test1' });
      analytics.addEvent({ type: 'test2' });
      
      await analytics.flushEvents();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('events')
      }));
    });

    test('should clear queue after successful send', async () => {
      analytics.addEvent({ type: 'test' });
      
      await analytics.flushEvents();
      
      expect(analytics.events).toHaveLength(0);
    });

    test('should re-queue events on failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      analytics.addEvent({ type: 'test' });
      
      await analytics.flushEvents();
      
      expect(analytics.events).toHaveLength(1);
    });
  });

  describe('getScrollDepth', () => {
    test('should calculate scroll depth percentage', () => {
      // Mock scroll position
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 2000
      });
      
      global.pageYOffset = 1000;
      window.innerHeight = 500;
      
      const depth = analytics.getScrollDepth();
      
      expect(depth).toBeCloseTo(67, 0); // (1000 / (2000 - 500)) * 100 ≈ 67
    });

    test('should handle zero document height', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 0
      });
      
      const depth = analytics.getScrollDepth();
      
      expect(depth).toBe(0);
    });
  });

  describe('getResourceType', () => {
    test('should identify image resources', () => {
      expect(analytics.getResourceType('https://example.com/image.jpg')).toBe('image');
      expect(analytics.getResourceType('https://example.com/photo.png')).toBe('image');
      expect(analytics.getResourceType('https://example.com/graphic.webp')).toBe('image');
    });

    test('should identify script resources', () => {
      expect(analytics.getResourceType('https://example.com/app.js')).toBe('script');
      expect(analytics.getResourceType('https://example.com/module.mjs')).toBe('script');
    });

    test('should identify stylesheet resources', () => {
      expect(analytics.getResourceType('https://example.com/styles.css')).toBe('stylesheet');
      expect(analytics.getResourceType('https://example.com/theme.scss')).toBe('stylesheet');
    });

    test('should identify font resources', () => {
      expect(analytics.getResourceType('https://example.com/font.woff2')).toBe('font');
      expect(analytics.getResourceType('https://example.com/typeface.ttf')).toBe('font');
    });

    test('should return other for unknown types', () => {
      expect(analytics.getResourceType('https://example.com/document.pdf')).toBe('other');
      expect(analytics.getResourceType('https://example.com/data.json')).toBe('other');
    });
  });

  describe('getSessionId', () => {
    test('should return current session ID', () => {
      const sessionId = analytics.getSessionId();
      
      expect(sessionId).toBe(analytics.sessionId);
    });
  });

  describe('getQueuedEventsCount', () => {
    test('should return number of queued events', () => {
      expect(analytics.getQueuedEventsCount()).toBe(0);
      
      analytics.addEvent({ type: 'test1' });
      analytics.addEvent({ type: 'test2' });
      
      expect(analytics.getQueuedEventsCount()).toBe(2);
    });
  });

  describe('destroy', () => {
    test('should flush events before destroying', () => {
      const flushEventsSpy = jest.spyOn(analytics, 'flushEvents').mockImplementation();
      
      analytics.addEvent({ type: 'test' });
      analytics.destroy();
      
      expect(flushEventsSpy).toHaveBeenCalled();
      
      flushEventsSpy.mockRestore();
    });

    test('should clear flush timer', () => {
      jest.useFakeTimers();
      analytics.init();
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      analytics.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });

    test('should reset initialization flag', () => {
      analytics.init();
      expect(analytics.isInitialized).toBe(true);
      
      analytics.destroy();
      expect(analytics.isInitialized).toBe(false);
    });

    test('should clear events queue', () => {
      analytics.addEvent({ type: 'test' });
      analytics.destroy();
      
      expect(analytics.events).toHaveLength(0);
    });
  });

  describe('Core Web Vitals ratings', () => {
    describe('getLCPRating', () => {
      test('should rate LCP <= 2500ms as good', () => {
        expect(analytics.getLCPRating(2000)).toBe('good');
        expect(analytics.getLCPRating(2500)).toBe('good');
      });

      test('should rate LCP 2501-4000ms as needs-improvement', () => {
        expect(analytics.getLCPRating(3000)).toBe('needs-improvement');
        expect(analytics.getLCPRating(4000)).toBe('needs-improvement');
      });

      test('should rate LCP > 4000ms as poor', () => {
        expect(analytics.getLCPRating(4500)).toBe('poor');
        expect(analytics.getLCPRating(6000)).toBe('poor');
      });
    });

    describe('getFIDRating', () => {
      test('should rate FID <= 100ms as good', () => {
        expect(analytics.getFIDRating(50)).toBe('good');
        expect(analytics.getFIDRating(100)).toBe('good');
      });

      test('should rate FID 101-300ms as needs-improvement', () => {
        expect(analytics.getFIDRating(200)).toBe('needs-improvement');
        expect(analytics.getFIDRating(300)).toBe('needs-improvement');
      });

      test('should rate FID > 300ms as poor', () => {
        expect(analytics.getFIDRating(350)).toBe('poor');
        expect(analytics.getFIDRating(500)).toBe('poor');
      });
    });

    describe('getCLSRating', () => {
      test('should rate CLS <= 0.1 as good', () => {
        expect(analytics.getCLSRating(0.05)).toBe('good');
        expect(analytics.getCLSRating(0.1)).toBe('good');
      });

      test('should rate CLS 0.11-0.25 as needs-improvement', () => {
        expect(analytics.getCLSRating(0.15)).toBe('needs-improvement');
        expect(analytics.getCLSRating(0.25)).toBe('needs-improvement');
      });

      test('should rate CLS > 0.25 as poor', () => {
        expect(analytics.getCLSRating(0.3)).toBe('poor');
        expect(analytics.getCLSRating(0.5)).toBe('poor');
      });
    });

    describe('getINPRating', () => {
      test('should rate INP <= 200ms as good', () => {
        expect(analytics.getINPRating(150)).toBe('good');
        expect(analytics.getINPRating(200)).toBe('good');
      });

      test('should rate INP 201-500ms as needs-improvement', () => {
        expect(analytics.getINPRating(300)).toBe('needs-improvement');
        expect(analytics.getINPRating(500)).toBe('needs-improvement');
      });

      test('should rate INP > 500ms as poor', () => {
        expect(analytics.getINPRating(600)).toBe('poor');
        expect(analytics.getINPRating(800)).toBe('poor');
      });
    });
  });
});
