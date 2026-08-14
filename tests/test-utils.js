/**
 * @fileoverview Simple test utilities for browser-based testing
 * @module tests/test-utils
 */

/**
 * Test suite container
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeEachFns = [];
    this.afterEachFns = [];
  }
  
  addTest(test) {
    this.tests.push(test);
  }
  
  addBeforeEach(fn) {
    this.beforeEachFns.push(fn);
  }
  
  addAfterEach(fn) {
    this.afterEachFns.push(fn);
  }
  
  async run() {
    console.log(`\nRunning: ${this.name}`);
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      // Run beforeEach hooks
      for (const hook of this.beforeEachFns) {
        await hook();
      }
      
      try {
        await test.fn();
        console.log(`  ✓ ${test.name}`);
        passed++;
      } catch (error) {
        console.error(`  ✗ ${test.name}`);
        console.error(`    Error: ${error.message}`);
        failed++;
      }
      
      // Run afterEach hooks
      for (const hook of this.afterEachFns) {
        await hook();
      }
    }
    
    return { passed, failed };
  }
}

/**
 * Global test registry
 */
const suites = new Map();
let currentSuite = null;

/**
 * Define a test suite
 * @param {string} name - Suite name
 * @param {Function} fn - Suite function
 */
export function describe(name, fn) {
  const suite = new TestSuite(name);
  suites.set(name, suite);
  currentSuite = suite;
  fn();
  currentSuite = null;
}

/**
 * Define a test case
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function it(name, fn) {
  if (!currentSuite) {
    throw new Error('it() must be called within describe()');
  }
  currentSuite.addTest({ name, fn });
}

/**
 * Before each test hook
 * @param {Function} fn - Hook function
 */
export function beforeEach(fn) {
  if (!currentSuite) {
    throw new Error('beforeEach() must be called within describe()');
  }
  currentSuite.addBeforeEach(fn);
}

/**
 * After each test hook
 * @param {Function} fn - Hook function
 */
export function afterEach(fn) {
  if (!currentSuite) {
    throw new Error('afterEach() must be called within describe()');
  }
  currentSuite.addAfterEach(fn);
}

/**
 * Assertion class
 */
export class Expectation {
  constructor(actual) {
    this.actual = actual;
  }
  
  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected}, got ${this.actual}`);
    }
  }
  
  toEqual(expected) {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
    }
  }
  
  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected truthy value, got ${this.actual}`);
    }
  }
  
  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected falsy value, got ${this.actual}`);
    }
  }
  
  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected null, got ${this.actual}`);
    }
  }
  
  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected undefined, got ${this.actual}`);
    }
  }
  
  toContain(expected) {
    if (!this.actual.includes(expected)) {
      throw new Error(`Expected ${this.actual} to contain ${expected}`);
    }
  }
  
  toMatch(pattern) {
    if (!pattern.test(this.actual)) {
      throw new Error(`Expected ${this.actual} to match ${pattern}`);
    }
  }
  
  toBeGreaterThan(value) {
    if (this.actual <= value) {
      throw new Error(`Expected ${this.actual} > ${value}`);
    }
  }
  
  toBeLessThan(value) {
    if (this.actual >= value) {
      throw new Error(`Expected ${this.actual} < ${value}`);
    }
  }
  
  toBeGreaterThanOrEqual(value) {
    if (this.actual < value) {
      throw new Error(`Expected ${this.actual} >= ${value}`);
    }
  }
  
  toBeLessThanOrEqual(value) {
    if (this.actual > value) {
      throw new Error(`Expected ${this.actual} <= ${value}`);
    }
  }
  
  not() {
    const negate = (fn) => {
      try {
        fn();
        throw new Error('Expected assertion to fail but it passed');
      } catch (e) {
        if (e.message.includes('Expected assertion to fail')) {
          throw e;
        }
        // Assertion failed as expected
      }
    };
    
    return {
      toBe: (expected) => negate(() => this.toBe(expected)),
      toEqual: (expected) => negate(() => this.toEqual(expected)),
      toBeNull: () => negate(() => this.toBeNull()),
      toBeUndefined: () => negate(() => this.toBeUndefined()),
      toContain: (expected) => negate(() => this.toContain(expected)),
      toMatch: (pattern) => negate(() => this.toMatch(pattern))
    };
  }
}

/**
 * Create expectation
 * @param {*} actual - Actual value
 * @returns {Expectation} Expectation instance
 */
export function expect(actual) {
  return new Expectation(actual);
}

/**
 * Run all tests
 * @returns {Promise<Object>} Test results
 */
export async function runTests() {
  console.log('\n========================================');
  console.log('         RUNNING TEST SUITE           ');
  console.log('========================================\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];
  
  for (const [name, suite] of suites) {
    try {
      const result = await suite.run();
      results.push({ name, ...result });
      totalPassed += result.passed;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Failed to run suite "${name}": ${error.message}`);
      results.push({ name, passed: 0, failed: 1, error: error.message });
      totalFailed++;
    }
  }
  
  console.log('\n========================================');
  console.log(`Total: ${totalPassed + totalFailed} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log('========================================\n');
  
  return {
    suites: results,
    totalPassed,
    totalFailed,
    success: totalFailed === 0
  };
}

// Export for global access
if (typeof window !== 'undefined') {
  window.describe = describe;
  window.it = it;
  window.beforeEach = beforeEach;
  window.afterEach = afterEach;
  window.expect = expect;
  window.runTests = runTests;
}
