#!/usr/bin/env node
/**
 * Test runner for ESM modules in Node.js.
 * Runs unit tests for the refactored src/ modules.
 * Usage: node tests/run-tests.js
 */

// --- Minimal test framework ---
class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.passed = 0;
    this.failed = 0;
  }
  describe(name, fn) {
    const suite = { name, tests: [] };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  }
  it(name, fn) {
    if (!this.currentSuite) throw new Error('it() must be within describe()');
    this.currentSuite.tests.push({ name, fn });
  }
  async run() {
    console.log('\n========================================');
    console.log('         RUNNING TEST SUITE           ');
    console.log('========================================\n');
    for (const suite of this.suites) {
      console.log(`Suite: ${suite.name}`);
      for (const test of suite.tests) {
        try {
          await test.fn();
          console.log(`  ✓ ${test.name}`);
          this.passed++;
        } catch (e) {
          console.log(`  ✗ ${test.name}`);
          console.log(`    Error: ${e.message}`);
          this.failed++;
        }
      }
    }
    console.log('\n========================================');
    console.log(`Total: ${this.passed + this.failed} | Passed: ${this.passed} | Failed: ${this.failed}`);
    console.log('========================================\n');
    return this.failed === 0;
  }
}

const runner = new TestRunner();
const describe = (name, fn) => runner.describe(name, fn);
const it = (name, fn) => runner.it(name, fn);

// --- Import modules under test ---
import {
  debounce, throttle, generateId, getNestedValue, deepMerge, isObject,
  formatDate, escapeHTML
} from '../src/utils/helpers.js';
import {
  DEFAULT_CONFIG, CSS_CLASSES, ARIA_LABELS, EVENT_NAMES, KEY_CODES, WEB_VITALS_THRESHOLDS
} from '../src/config/constants.js';
import { LocalStorage, SessionStorage, themeStorage, languageStorage } from '../src/utils/storage.js';
import App, { startApp } from '../src/index.js';

// --- helpers tests ---
describe('helpers', () => {
  it('debounce delays execution', (done) => {
    let n = 0;
    const d = debounce(() => n++, 80);
    d(); d(); d();
    if (n !== 0) throw new Error('debounce fired immediately');
    setTimeout(() => {
      if (n !== 1) throw new Error(`expected 1, got ${n}`);
      done();
    }, 120);
  });

  it('throttle limits rate', (done) => {
    let n = 0;
    const t = throttle(() => n++, 80);
    t(); t(); t();
    if (n !== 1) throw new Error(`expected 1 immediate, got ${n}`);
    setTimeout(() => {
      t();
      if (n !== 2) throw new Error(`expected 2, got ${n}`);
      done();
    }, 120);
  });

  it('generateId unique + prefixed', () => {
    if (generateId() === generateId()) throw new Error('ids not unique');
    if (!generateId('x').startsWith('x_')) throw new Error('prefix missing');
  });

  it('getNestedValue handles missing keys', () => {
    const o = { a: { b: { c: 1 } } };
    if (getNestedValue(o, 'a.b.c') !== 1) throw new Error('nested read failed');
    if (getNestedValue(o, 'a.x.y') !== null) throw new Error('should return null');
    if (getNestedValue(null, 'a') !== null) throw new Error('null safe failed');
  });

  it('deepMerge merges nested', () => {
    const r = deepMerge({ a: { x: 1 } }, { a: { y: 2 } }, { b: 3 });
    if (r.a.x !== 1 || r.a.y !== 2 || r.b !== 3) throw new Error('deepMerge wrong');
  });

  it('isObject correct', () => {
    if (!isObject({})) throw new Error('{} should be object');
    if (isObject([])) throw new Error('array should not be object');
    if (isObject(null) || isObject('s') || isObject(5)) throw new Error('primitive false positive');
  });

  it('formatDate returns string', () => {
    const r = formatDate('2024-01-15');
    if (typeof r !== 'string' || r.length === 0) throw new Error('formatDate empty');
  });

  it('escapeHTML DOM-independent check skipped in Node', () => {
    if (typeof document === 'undefined') { console.log('    (skipped - no DOM)'); return; }
    if (escapeHTML('<b>') !== '&lt;b&gt;') throw new Error('escapeHTML wrong');
  });
});

// --- constants tests ---
describe('constants', () => {
  it('DEFAULT_CONFIG frozen + valid', () => {
    if (DEFAULT_CONFIG.DEFAULT_THEME !== 'auto') throw new Error('default theme wrong');
    if (!DEFAULT_CONFIG.THEMES.includes('dark')) throw new Error('themes missing dark');
  });
  it('CSS_CLASSES / ARIA / EVENTS / KEYS present', () => {
    if (!CSS_CLASSES.THEME_DARK) throw new Error('CSS_CLASSES missing');
    if (!ARIA_LABELS.THEME_SWITCHER) throw new Error('ARIA missing');
    if (!EVENT_NAMES.THEME_CHANGED) throw new Error('EVENTS missing');
    if (KEY_CODES.ESCAPE !== 'Escape') throw new Error('KEY_CODES wrong');
  });
  it('WEB_VITALS_THRESHOLDS has LCP/FID/CLS', () => {
    if (!WEB_VITALS_THRESHOLDS.LCP || !WEB_VITALS_THRESHOLDS.FID || !WEB_VITALS_THRESHOLDS.CLS)
      throw new Error('web vitals incomplete');
  });
});

// --- storage tests (in-memory fallback in Node) ---
describe('storage', () => {
  it('LocalStorage set/get/remove with fallback', () => {
    const s = new LocalStorage('test:');
    s.set('k', { a: 1 });
    if (JSON.stringify(s.get('k')) !== JSON.stringify({ a: 1 })) throw new Error('get mismatch');
    s.remove('k');
    if (s.get('k') !== null) throw new Error('remove failed');
  });
  it('SessionStorage extends LocalStorage', () => {
    const s = new SessionStorage();
    s.set('x', 42);
    if (s.get('x') !== 42) throw new Error('session get failed');
  });
  it('prefixed keys', () => {
    const s = new LocalStorage('ns:');
    s.set('v', 1);
    if (!s.keys().some(k => k.startsWith('ns:'))) throw new Error('prefix not applied');
  });
  it('pre-configured instances exist', () => {
    if (!themeStorage || !languageStorage) throw new Error('instances missing');
  });
});

// --- index / App bootstrap tests ---
describe('index (App)', () => {
  it('exports App object with helpers + storage', () => {
    if (typeof App !== 'object') throw new Error('App not exported');
    if (typeof App.helpers.debounce !== 'function') throw new Error('App.helpers missing');
    if (typeof App.storage.LocalStorage !== 'function') throw new Error('App.storage missing');
  });
  it('startApp is a function and safe to call in Node (no document)', () => {
    if (typeof startApp !== 'function') throw new Error('startApp not exported');
    // In Node document is undefined, so startApp must not throw
    startApp();
  });
});

const success = await runner.run();
process.exit(success ? 0 : 1);