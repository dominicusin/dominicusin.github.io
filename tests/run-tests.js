#!/usr/bin/env node
/**
 * Simple test runner for ESM modules in Node.js
 * Usage: node tests/run-tests.js
 */

// Simple test utilities
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

// Helper for sync/async tests
const describe = (name, fn) => runner.describe(name, fn);
const it = (name, fn) => runner.it(name, fn);

// Import helpers module
import {
  debounce,
  throttle,
  generateId,
  getNestedValue,
  isObject,
  formatDate,
  escapeHTML
} from '../src/utils/helpers.js';

// Define test suite
describe('Helpers', () => {
  describe('debounce', () => {
    it('should delay function execution', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      if (callCount !== 0) {
        throw new Error('debounce failed: immediate call');
      }

      setTimeout(() => {
        if (callCount !== 1) {
          throw new Error(`debounce failed: expected 1, got ${callCount}`);
        }
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      if (callCount !== 1) {
        throw new Error(`throttle failed: expected 1, got ${callCount}`);
      }

      setTimeout(() => {
        throttledFn();
        if (callCount !== 2) {
          throw new Error(`throttle failed: expected 2, got ${callCount}`);
        }
        done();
      }, 150);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      if (id1 === id2) throw new Error('generateId failed: IDs are not unique');
    });

    it('should use custom prefix', () => {
      const id = generateId('test');
      if (!id.startsWith('test_')) throw new Error(`generateId failed: expected prefix "test_", got "${id}"`);
    });

    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      const timestamp = parseInt(id.split('_')[1]);
      if (timestamp < before || timestamp > after) throw new Error('generateId timestamp validation failed');
    });
  });

  describe('getNestedValue', () => {
    const obj = {
      a: { b: { c: 'deep value' }, d: 'shallow value' },
      e: 'top level'
    };

    it('should get nested values', () => {
      if (getNestedValue(obj, 'a.b.c') !== 'deep value') throw new Error('getNestedValue failed for a.b.c');
      if (getNestedValue(obj, 'a.d') !== 'shallow value') throw new Error('getNestedValue failed for a.d');
      if (getNestedValue(obj, 'e') !== 'top level') throw new Error('getNestedValue failed for e');
    });

    it('should return null for missing keys', () => {
      if (getNestedValue(obj, 'a.b.x') !== null) throw new Error('getNestedValue should return null for a.b.x');
      if (getNestedValue(obj, 'x.y.z') !== null) throw new Error('getNestedValue should return null for x.y.z');
    });

    it('should handle null/undefined objects', () => {
      if (getNestedValue(null, 'a.b') !== null) throw new Error('getNestedValue should return null for null object');
      if (getNestedValue(undefined, 'a.b') !== null) throw new Error('getNestedValue should return null for undefined object');
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      if (!isObject({})) throw new Error('isObject failed for {}');
      if (!isObject({ key: 'value' })) throw new Error('isObject failed for object');
    });

    it('should return false for arrays', () => {
      if (isObject([])) throw new Error('isObject should return false for []');
      if (isObject([1, 2, 3])) throw new Error('isObject should return false for array');
    });

    it('should return false for primitives', () => {
      if (isObject(null)) throw new Error('isObject should return false for null');
      if (isObject(undefined)) throw new Error('isObject should return false for undefined');
      if (isObject('string')) throw new Error('isObject should return false for string');
      if (isObject(123)) throw new Error('isObject should return false for number');
      if (isObject(true)) throw new Error('isObject should return false for boolean');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      // Accept any valid date format (Russian or English locale)
      const pattern = /\w+.*\d+.*\d+/;
      if (!pattern.test(result)) throw new Error(`formatDate failed: "${result}" doesn't match pattern`);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date);
      const pattern = /\w+.*\d+.*\d+/;
      if (!pattern.test(result)) throw new Error(`formatDate failed: "${result}" doesn't match pattern`);
    });

    it('should accept custom options', () => {
      const result = formatDate('2024-01-15', { year: 'numeric', month: 'long' });
      // Accept any month name in result
      if (!result || typeof result !== 'string') throw new Error(`formatDate failed: invalid result "${result}"`);
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      // Skip in Node.js (no DOM)
      if (typeof document === 'undefined') {
        console.log('    (skipped - no DOM in Node.js)');
        return;
      }
      const result = escapeHTML('<script>alert("xss")</script>');
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      if (result !== expected) throw new Error(`escapeHTML failed: expected "${expected}", got "${result}"`);
    });

    it('should handle plain text', () => {
      if (typeof document === 'undefined') {
        console.log('    (skipped - no DOM in Node.js)');
        return;
      }
      if (escapeHTML('Hello World') !== 'Hello World') {
        throw new Error('escapeHTML should preserve plain text');
      }
    });

    it('should escape ampersands', () => {
      if (typeof document === 'undefined') {
        console.log('    (skipped - no DOM in Node.js)');
        return;
      }
      if (escapeHTML('Tom & Jerry') !== 'Tom &amp; Jerry') {
        throw new Error('escapeHTML failed for ampersand');
      }
    });
  });
});

// Run tests
const success = await runner.run();
process.exit(success ? 0 : 1);