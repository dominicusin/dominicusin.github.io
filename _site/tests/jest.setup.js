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
      // Fire load synchronously so onload handlers run within the same tick
      // (jsdom never fires native load events for images).
      this.dispatchEvent(new window.Event('load'));
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

// Minimal in-memory IndexedDB polyfill (for vector-store tests).
// Implements just enough of the IDB API (open / objectStore / get / put / getAll / clear).
if (typeof global.indexedDB === 'undefined' && typeof window !== 'undefined') {
  function makeStore(keyPath) {
    const map = new Map();
    const req = (val) => {
      const r = { result: val, onsuccess: null, onerror: null };
      setTimeout(() => { if (r.onsuccess) r.onsuccess({ target: { result: val } }); }, 0);
      return r;
    };
    return {
      keyPath,
      put(record) {
        const key = keyPath ? record[keyPath] : record.key;
        map.set(key, record);
        return req(undefined);
      },
      get(key) {
        return req(map.has(key) ? map.get(key) : undefined);
      },
      getAll() {
        return req([...map.values()]);
      },
      clear() {
        map.clear();
        return req(undefined);
      }
    };
  }
  class FakeIDB {
    constructor() {
      this.dbs = new Map();
    }
    open(name, version) {
      const req = {
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };
      setTimeout(() => {
        let db = this.dbs.get(name);
        if (!db || db.version < version) {
          db = { name, version, stores: new Map(), objectStoreNames: { contains: (n) => db.stores.has(n) } };
          db.createObjectStore = (storeName, opts) => {
            const s = makeStore(opts && opts.keyPath);
            db.stores.set(storeName, s);
            return s;
          };
          db.transaction = (_storeName, _mode) => {
            const tx = {
              onsuccess: null,
              onerror: null,
              objectStore: (n) => {
                if (!db.stores.has(n)) db.stores.set(n, makeStore('id'));
                return db.stores.get(n);
              }
            };
            // Fire success after the current synchronous store ops complete.
            setTimeout(() => { if (tx.onsuccess) tx.onsuccess({ target: { result: undefined } }); }, 0);
            return tx;
          };
          this.dbs.set(name, db);
          if (req.onupgradeneeded) {
            req.onupgradeneeded({ target: { result: db } });
          }
        }
        req.result = db;
        if (req.onsuccess) req.onsuccess();
      }, 0);
      return req;
    }
  }
  global.indexedDB = new FakeIDB();
  if (typeof window !== 'undefined') window.indexedDB = global.indexedDB;
}
