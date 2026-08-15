/**
 * Unit Tests for RUM Service v2.0
 * 
 * Coverage:
 * - Device detection and adaptive sampling
 * - Core Web Vitals collection (LCP, INP, CLS)
 * - Percentile calculations (P75, P95, P99)
 * - Batch processing and retry logic
 * - Offline support with IndexedDB
 * - Health scoring and analytics
 */

import RUMService from '@services/rum-service.js';

describe('RUMService', () => {
  let rumService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.testUtils?.resetAllMocks();
    
    rumService = new RUMService({
      endpoint: '/test-metrics',
      sampleRate: 1.0,
      batchSize: 5,
      flushInterval: 1000,
      maxRetries: 3,
      enableOffline: true
    });
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const service = new RUMService();
      
      expect(service.endpoint).toBe('/assets/rum/metrics.json');
      expect(service.sampleRate).toBe(1.0);
      expect(service.batchSize).toBe(10);
      expect(service.flushInterval).toBe(30000);
      expect(service.maxRetries).toBe(3);
      expect(service.enableOffline).toBe(true);
    });

    test('should initialize with custom options', () => {
      const service = new RUMService({
        endpoint: '/custom-endpoint',
        sampleRate: 0.5,
        batchSize: 20,
        flushInterval: 60000,
        maxRetries: 5
      });
      
      expect(service.endpoint).toBe('/custom-endpoint');
      expect(service.sampleRate).toBe(0.5);
      expect(service.batchSize).toBe(20);
      expect(service.flushInterval).toBe(60000);
      expect(service.maxRetries).toBe(5);
    });

    test('should detect device class correctly', () => {
      // Mock high-end device
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
      
      const service = new RUMService();
      expect(service.deviceClass).toBe('high');
      
      // Mock low-end device
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
      
      const service2 = new RUMService();
      expect(service2.deviceClass).toBe('low');
    });
  });

  describe('Adaptive Sampling', () => {
    test('should return higher sample rate for high-end devices', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'connection', { 
        value: { effectiveType: '4g' }, 
        configurable: true 
      });
      
      const service = new RUMService({ sampleRate: 0.5 });
      const rate = service.getAdaptiveSampleRate();
      
      expect(rate).toBeGreaterThanOrEqual(0.5);
    });

    test('should return lower sample rate for low-end devices', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
      
      const service = new RUMService({ sampleRate: 0.5 });
      const rate = service.getAdaptiveSampleRate();
      
      expect(rate).toBeLessThan(0.5);
    });
  });

  describe('Percentile Calculations', () => {
    test('should calculate P75 correctly', () => {
      const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      const p75 = rumService.calculatePercentile(values, 75);
      
      expect(p75).toBeWithinRange(700, 800);
    });

    test('should calculate P95 correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
      const p95 = rumService.calculatePercentile(values, 95);
      
      expect(p95).toBeWithinRange(950, 960);
    });

    test('should calculate P99 correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
      const p99 = rumService.calculatePercentile(values, 99);
      
      expect(p99).toBeWithinRange(990, 1000);
    });

    test('should handle empty arrays', () => {
      const result = rumService.calculatePercentile([], 95);
      expect(result).toBe(0);
    });

    test('should handle single element arrays', () => {
      const result = rumService.calculatePercentile([42], 95);
      expect(result).toBe(42);
    });
  });

  describe('Metric Classification', () => {
    test('should classify LCP as good when under threshold', () => {
      const result = rumService.classifyMetric('lcp', 2000);
      expect(result).toBe('good');
    });

    test('should classify LCP as warning when near threshold', () => {
      const result = rumService.classifyMetric('lcp', 3000);
      expect(result).toBe('warning');
    });

    test('should classify LCP as poor when over threshold', () => {
      const result = rumService.classifyMetric('lcp', 5000);
      expect(result).toBe('poor');
    });

    test('should classify INP correctly', () => {
      expect(rumService.classifyMetric('inp', 150)).toBe('good');
      expect(rumService.classifyMetric('inp', 300)).toBe('warning');
      expect(rumService.classifyMetric('inp', 600)).toBe('poor');
    });

    test('should classify CLS correctly', () => {
      expect(rumService.classifyMetric('cls', 0.05)).toBe('good');
      expect(rumService.classifyMetric('cls', 0.15)).toBe('warning');
      expect(rumService.classifyMetric('cls', 0.3)).toBe('poor');
    });

    test('should return unknown for invalid metric types', () => {
      const result = rumService.classifyMetric('invalid', 100);
      expect(result).toBe('unknown');
    });
  });

  describe('Health Scoring', () => {
    test('should calculate health score of 100 for perfect metrics', () => {
      const metrics = {
        lcp: { p75: 1000, classification: 'good' },
        inp: { p75: 50, classification: 'good' },
        cls: { p75: 0.01, classification: 'good' }
      };
      
      const score = rumService.calculateHealthScore(metrics);
      expect(score).toBe(100);
    });

    test('should calculate reduced health score for poor metrics', () => {
      const metrics = {
        lcp: { p75: 5000, classification: 'poor' },
        inp: { p75: 600, classification: 'poor' },
        cls: { p75: 0.3, classification: 'poor' }
      };
      
      const score = rumService.calculateHealthScore(metrics);
      expect(score).toBeLessThan(50);
    });

    test('should handle partial metrics', () => {
      const metrics = {
        lcp: { p75: 2000, classification: 'good' }
      };
      
      const score = rumService.calculateHealthScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Batch Processing', () => {
    test('should queue metrics until batch size is reached', async () => {
      const flushSpy = jest.spyOn(rumService, 'flushMetrics').mockResolvedValue();
      
      // Add metrics below batch size
      for (let i = 0; i < 3; i++) {
        await rumService.queueMetric({ type: 'LCP', value: 1000 + i * 100 });
      }
      
      expect(flushSpy).not.toHaveBeenCalled();
      expect(rumService.metricsQueue.length).toBe(3);
    });

    test('should flush when batch size is reached', async () => {
      const flushSpy = jest.spyOn(rumService, 'flushMetrics').mockResolvedValue();
      
      // Add metrics to reach batch size
      for (let i = 0; i < 5; i++) {
        await rumService.queueMetric({ type: 'LCP', value: 1000 + i * 100 });
      }
      
      expect(flushSpy).toHaveBeenCalledTimes(1);
      expect(rumService.metricsQueue.length).toBe(0);
    });

    test('should include device class in queued metrics', async () => {
      await rumService.queueMetric({ type: 'LCP', value: 2000 });
      
      expect(rumService.metricsQueue[0]).toMatchObject({
        type: 'LCP',
        value: 2000,
        deviceClass: expect.any(String),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Retry Logic', () => {
    test('should retry failed requests with exponential backoff', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
      
      rumService.retryCounts.set('test-1', 0);
      
      await rumService.flushMetrics();
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should stop retrying after max retries', async () => {
      global.fetch.mockRejectedValue(new Error('Persistent network error'));
      
      rumService.retryCounts.set('test-2', 5); // Already exceeded max
      
      await rumService.flushMetrics();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should clear retry count on success', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200 });
      
      const metric = { type: 'LCP', value: 2000, id: 'test-3' };
      rumService.retryCounts.set('test-3', 2);
      rumService.metricsQueue.push(metric);
      
      await rumService.flushMetrics();
      
      expect(rumService.retryCounts.has('test-3')).toBe(false);
    });
  });

  describe('Analytics Report', () => {
    test('should generate comprehensive analytics report', () => {
      // Populate metric history
      rumService.metricHistory.lcp = [1000, 1500, 2000, 2500, 3000];
      rumService.metricHistory.inp = [50, 100, 150, 200, 250];
      rumService.metricHistory.cls = [0.01, 0.05, 0.1, 0.15, 0.2];
      
      const report = rumService.getAnalyticsReport();
      
      expect(report).toHaveProperty('lcp');
      expect(report).toHaveProperty('inp');
      expect(report).toHaveProperty('cls');
      expect(report.lcp).toHaveProperty('p75');
      expect(report.lcp).toHaveProperty('p95');
      expect(report.lcp).toHaveProperty('p99');
    });

    test('should return empty report when no data', () => {
      const report = rumService.getAnalyticsReport();
      
      expect(report.lcp.p75).toBe(0);
      expect(report.inp.p75).toBe(0);
      expect(report.cls.p75).toBe(0);
    });
  });

  describe('Offline Support', () => {
    test('should store metrics in IndexedDB when offline', async () => {
      const originalOnline = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      
      await rumService.queueMetric({ type: 'LCP', value: 2000 });
      
      // Should not attempt to flush when offline
      expect(global.fetch).not.toHaveBeenCalled();
      expect(rumService.metricsQueue.length).toBe(1);
      
      Object.defineProperty(navigator, 'onLine', { value: originalOnline, configurable: true });
    });

    test('should sync queued metrics when coming back online', async () => {
      const flushSpy = jest.spyOn(rumService, 'flushMetrics').mockResolvedValue();
      
      // Simulate going offline then online
      const event = new Event('online');
      window.dispatchEvent(event);
      
      await global.testUtils?.wait(100);
      
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    test('should use requestIdleCallback for non-critical operations', async () => {
      const idleCallbackSpy = jest.spyOn(global, 'requestIdleCallback');
      
      rumService.scheduleIdleTask(() => {});
      
      expect(idleCallbackSpy).toHaveBeenCalled();
      
      idleCallbackSpy.mockRestore();
    });

    test('should respect idle timeout', async () => {
      let callbackExecuted = false;
      
      rumService.scheduleIdleTask(() => {
        callbackExecuted = true;
      });
      
      await global.testUtils?.wait(100);
      expect(callbackExecuted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle extremely large metric values', () => {
      const largeValue = Number.MAX_SAFE_INTEGER;
      const result = rumService.classifyMetric('lcp', largeValue);
      expect(result).toBe('poor');
    });

    test('should handle negative metric values gracefully', () => {
      const result = rumService.classifyMetric('lcp', -100);
      expect(result).toBe('good'); // Negative treated as instant
    });

    test('should handle NaN values', () => {
      const result = rumService.calculatePercentile([NaN, NaN], 95);
      expect(result).toBe(0);
    });

    test('should handle very small CLS values', () => {
      const result = rumService.classifyMetric('cls', 0.0000001);
      expect(result).toBe('good');
    });
  });
});
