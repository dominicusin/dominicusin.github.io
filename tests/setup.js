/**
 * Global Test Setup for Engineering Blog v3.0
 * Configures mocks, utilities, and test environment
 */

// Mock IndexedDB for browser-based tests
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: jest.fn(() => ({
        add: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
        createIndex: jest.fn()
      })),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(),
        oncomplete: null,
        onerror: null
      }))
    }
  }))
};

global.indexedDB = mockIndexedDB;

// Mock Web Workers
class MockWorker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(msg) {
    // Simulate worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'MOCK_RESPONSE', payload: msg } });
      }
    }, 10);
  }

  terminate() {}
}

global.Worker = MockWorker;

// Mock Service Worker API
global.navigator = global.navigator || {};
global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve({
    active: { postMessage: jest.fn() },
    installing: null,
    waiting: null
  })),
  getRegistration: jest.fn(() => Promise.resolve(null)),
  controller: null
};

// Mock Performance API
const mockPerformanceMeasure = jest.fn();
const mockPerformanceMark = jest.fn();
const mockPerformanceNow = jest.fn(() => Date.now());

global.performance = {
  now: mockPerformanceNow,
  measure: mockPerformanceMeasure,
  mark: mockPerformanceMark,
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  timing: {
    navigationStart: Date.now() - 1000,
    domContentLoadedEventEnd: Date.now() - 500,
    loadEventEnd: Date.now()
  },
  memory: {
    jsHeapSizeLimit: 2197815,
    totalJSHeapSize: 1048576,
    usedJSHeapSize: 524288
  }
};

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Utility for tests to trigger observations
  trigger(elements) {
    const entries = elements.map(el => ({
      isIntersecting: true,
      intersectionRatio: 1.0,
      target: el,
      boundingClientRect: { top: 0, left: 0, width: 100, height: 100 },
      intersectionRect: { top: 0, left: 0, width: 100, height: 100 },
      rootBounds: { top: 0, left: 0, width: 800, height: 600 },
      time: Date.now()
    }));
    this.callback(entries, this);
  }
};

// Mock Resize Observer
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Broadcast Channel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }

  postMessage(msg) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: msg });
      }
    }, 0);
  }

  close() {}
};

// Mock fetch with intelligent mocking
const originalFetch = global.fetch;
global.fetch = jest.fn((url, options = {}) => {
  // Default mock implementation
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Map(),
    redirected: false,
    type: 'basic',
    url: url
  });
});

// Mock requestIdleCallback
global.requestIdleCallback = global.requestIdleCallback || ((cb) => {
  const start = Date.now();
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    });
  }, 1);
});

global.cancelIdleCallback = global.cancelIdleCallback || clearTimeout;

// Mock sendBeacon
global.navigator.sendBeacon = jest.fn(() => true);

// Utility functions for tests
global.testUtils = {
  /**
   * Wait for next tick
   */
  wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a mock DOM element
   */
  createElement: (tag, props = {}) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      el[key] = value;
    });
    return el;
  },
  
  /**
   * Mock performance metrics
   */
  mockPerformanceMetrics: (metrics) => {
    const entries = [];
    if (metrics.lcp) {
      entries.push({
        entryType: 'largest-contentful-paint',
        startTime: metrics.lcp.startTime,
        duration: 0,
        size: metrics.lcp.size,
        url: metrics.lcp.url,
        element: metrics.lcp.element || null
      });
    }
    if (metrics.inp) {
      entries.push({
        entryType: 'event',
        startTime: metrics.inp.startTime,
        duration: metrics.inp.duration,
        processingStart: metrics.inp.processingStart,
        processingEnd: metrics.inp.processingEnd,
        name: metrics.inp.eventType || 'click'
      });
    }
    if (metrics.cls) {
      entries.push({
        entryType: 'layout-shift',
        startTime: metrics.cls.startTime,
        duration: 0,
        value: metrics.cls.value,
        sources: metrics.cls.sources || []
      });
    }
    global.performance.getEntriesByType.mockReturnValue(entries);
  },
  
  /**
   * Reset all mocks
   */
  resetAllMocks: () => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockPerformanceNow.mockClear();
    mockPerformanceMeasure.mockClear();
    mockPerformanceMark.mockClear();
  }
};

// Custom matchers for performance testing
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveGoodCoreWebVitals(received) {
    const thresholds = {
      lcp: 2500,
      inp: 200,
      cls: 0.1
    };
    
    const pass = 
      received.lcp <= thresholds.lcp &&
      received.inp <= thresholds.inp &&
      received.cls <= thresholds.cls;
    
    if (pass) {
      return {
        message: () => `expected metrics not to meet Core Web Vitals "Good" thresholds`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected metrics to meet Core Web Vitals "Good" thresholds (LCP<${thresholds.lcp}, INP<${thresholds.inp}, CLS<${thresholds.cls})`,
        pass: false,
      };
    }
  }
});

console.log('✓ Test environment initialized successfully');
