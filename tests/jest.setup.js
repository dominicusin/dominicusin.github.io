// Jest setup: polyfill browser APIs jsdom lacks but the modules expect.
// Runs after the test framework is installed, before each test file.

// IntersectionObserver (used by image-optimizer, lazy loading)
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }
  observe(el) { this.elements.add(el); }
  unobserve(el) { this.elements.delete(el); }
  disconnect() { this.elements.clear(); }
  takeRecords() { return []; }
  // Helper for tests to trigger intersections
  _trigger(entries) { this.callback(entries, this); }
}
global.IntersectionObserver = MockIntersectionObserver;

// matchMedia (used by theme-manager system-preference detection)
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

// fetch mock (analytics-service posts events)
if (!global.fetch) {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve('')
  }));
}

// requestIdleCallback / cancelIdleCallback (helpers.js)
if (!global.requestIdleCallback) {
  global.requestIdleCallback = (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0);
  global.cancelIdleCallback = (id) => clearTimeout(id);
}

// Crypto.randomUUID fallback for older jsdom
if (!global.crypto) global.crypto = {};
if (!global.crypto.randomUUID) {
  let n = 0;
  global.crypto.randomUUID = () => `uuid-${(n++).toString(16)}-${Date.now().toString(16)}`;
}

// ResizeObserver (some modules observe layout)
if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== 'undefined' && window.HTMLImageElement) {
  Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
    set(value) {
      this.setAttribute('src', value);
      // Defer so onload handlers attached after assignment still run
      setTimeout(() => {
        this.dispatchEvent(new window.Event('load'));
      }, 0);
    },
    get() {
      return this.getAttribute('src') || '';
    }
  });
}

// HTMLElement.scrollIntoView is not implemented in jsdom
if (typeof window !== 'undefined' && window.HTMLElement) {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  }
}
