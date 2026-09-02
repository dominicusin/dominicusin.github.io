// performance.test.cjs - Tests for performance analysis agent
const { analyzePerformance, DEFAULT_BUDGETS } = require('../workers/performance/performance.cjs');

// Simple test runner
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(arr, item, message) {
  if (!arr.includes(item)) {
    throw new Error(message || `Expected array to include ${JSON.stringify(item)}`);
  }
}

function assertGreaterThan(actual, threshold, message) {
  if (!(actual > threshold)) {
    throw new Error(message || `Expected ${actual} > ${threshold}`);
  }
}

// ============================================================
// Test Suite: analyzePerformance
// ============================================================
console.log('\nPerformance Agent Tests\n');

// --- Default Budgets ---
test('DEFAULT_BUDGETS has correct default values', () => {
  assertEqual(DEFAULT_BUDGETS.maxBundleSize, 500 * 1024, 'maxBundleSize should be 500KB');
  assertEqual(DEFAULT_BUDGETS.minLighthouseScore, 90, 'minLighthouseScore should be 90');
  assertEqual(DEFAULT_BUDGETS.maxLCP, 2500, 'maxLCP should be 2500ms');
  assertEqual(DEFAULT_BUDGETS.maxCLS, 0.1, 'maxCLS should be 0.1');
  assertEqual(DEFAULT_BUDGETS.maxTTI, 3500, 'maxTTI should be 3500ms');
  assert(DEFAULT_BUDGETS.heavyJsPatterns.length > 0, 'Should have heavy JS patterns');
});

// --- Empty/Minimal Input ---
test('Empty build output passes with no violations', async () => {
  const result = await analyzePerformance({ buildOutput: {}, budgets: {} });
  assertEqual(result.passed, true, 'Should pass with empty input');
  assertEqual(result.violations.length, 0, 'Should have no violations');
  assertEqual(result.suggestions.length, 0, 'Should have no suggestions');
  assertEqual(result.metrics.bundleSize, 0, 'Bundle size should be 0');
});

test('Empty build output with default budgets passes', async () => {
  const result = await analyzePerformance({ buildOutput: {} });
  assertEqual(result.passed, true, 'Should pass');
  assertEqual(result.violations.length, 0, 'No violations');
});

// --- Bundle Size Checks ---
test('Bundle size within budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { totalSize: 300 * 1024 }, // 300KB
    budgets: { maxBundleSize: 500 * 1024 },
  });
  assertEqual(result.passed, true, 'Should pass');
  assertEqual(result.metrics.bundleSize, 300 * 1024, 'Bundle size should match');
});

test('Bundle size at exact budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { totalSize: 500 * 1024 },
    budgets: { maxBundleSize: 500 * 1024 },
  });
  assertEqual(result.passed, true, 'Should pass at exact budget');
});

test('Bundle size over budget fails', async () => {
  const result = await analyzePerformance({
    buildOutput: { totalSize: 600 * 1024 }, // 600KB
    budgets: { maxBundleSize: 500 * 1024 },
  });
  assertEqual(result.passed, false, 'Should fail');
  assertEqual(result.violations.length, 1, 'Should have one violation');
  assert(result.violations[0].includes('600'), 'Violation should mention size');
  assert(result.violations[0].includes('500'), 'Violation should mention budget');
  assertGreaterThan(result.suggestions.length, 0, 'Should have suggestions');
});

test('Bundle size violation message includes overage', async () => {
  const result = await analyzePerformance({
    buildOutput: { totalSize: 700 * 1024 },
    budgets: { maxBundleSize: 500 * 1024 },
  });
  assert(result.violations[0].includes('200'), 'Should mention 200KB overage');
});

// --- Lighthouse Scores ---
test('Lighthouse score above minimum passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { performance: 95 } },
    budgets: { minLighthouseScore: 90 },
  });
  assertEqual(result.passed, true, 'Should pass');
});

test('Lighthouse score at minimum passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { performance: 90 } },
    budgets: { minLighthouseScore: 90 },
  });
  assertEqual(result.passed, true, 'Should pass at minimum');
});

test('Lighthouse score below minimum fails', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { performance: 75 } },
    budgets: { minLighthouseScore: 90 },
  });
  assertEqual(result.passed, false, 'Should fail');
  assertEqual(result.violations.length, 1, 'Should have one violation');
  assert(result.violations[0].includes('75'), 'Violation should mention score');
  assert(result.violations[0].includes('90'), 'Violation should mention minimum');
});

test('Lighthouse score uses overall when performance not present', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { overall: 85 } },
    budgets: { minLighthouseScore: 90 },
  });
  assertEqual(result.passed, false, 'Should fail with overall score');
});

test('Lighthouse score of 0 is ignored (no audit)', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: {} },
    budgets: { minLighthouseScore: 90 },
  });
  assertEqual(result.passed, true, 'Should pass when no score available');
});

// --- Core Web Vitals: LCP ---
test('LCP within budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { lcp: 2000 } },
    budgets: { maxLCP: 2500 },
  });
  assertEqual(result.passed, true, 'Should pass');
});

test('LCP at budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { lcp: 2500 } },
    budgets: { maxLCP: 2500 },
  });
  assertEqual(result.passed, true, 'Should pass at budget');
});

test('LCP over budget fails', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { lcp: 3000 } },
    budgets: { maxLCP: 2500 },
  });
  assertEqual(result.passed, false, 'Should fail');
  assert(result.violations[0].includes('LCP'), 'Violation should mention LCP');
  assert(result.violations[0].includes('3000'), 'Violation should mention value');
  assert(result.violations[0].includes('2500'), 'Violation should mention budget');
});

test('LCP null is ignored', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { lcp: null } },
    budgets: { maxLCP: 2500 },
  });
  assertEqual(result.passed, true, 'Should pass with null LCP');
});

// --- Core Web Vitals: CLS ---
test('CLS within budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { cls: 0.05 } },
    budgets: { maxCLS: 0.1 },
  });
  assertEqual(result.passed, true, 'Should pass');
});

test('CLS at budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { cls: 0.1 } },
    budgets: { maxCLS: 0.1 },
  });
  assertEqual(result.passed, true, 'Should pass at budget');
});

test('CLS over budget fails', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { cls: 0.25 } },
    budgets: { maxCLS: 0.1 },
  });
  assertEqual(result.passed, false, 'Should fail');
  assert(result.violations[0].includes('CLS'), 'Violation should mention CLS');
});

test('CLS null is ignored', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { cls: null } },
    budgets: { maxCLS: 0.1 },
  });
  assertEqual(result.passed, true, 'Should pass with null CLS');
});

// --- Core Web Vitals: TTI ---
test('TTI within budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { tti: 3000 } },
    budgets: { maxTTI: 3500 },
  });
  assertEqual(result.passed, true, 'Should pass');
});

test('TTI at budget passes', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { tti: 3500 } },
    budgets: { maxTTI: 3500 },
  });
  assertEqual(result.passed, true, 'Should pass at budget');
});

test('TTI over budget fails', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { tti: 4000 } },
    budgets: { maxTTI: 3500 },
  });
  assertEqual(result.passed, false, 'Should fail');
  assert(result.violations[0].includes('TTI'), 'Violation should mention TTI');
});

test('TTI null is ignored', async () => {
  const result = await analyzePerformance({
    buildOutput: { lighthouse: { tti: null } },
    budgets: { maxTTI: 3500 },
  });
  assertEqual(result.passed, true, 'Should pass with null TTI');
});

// --- Heavy JS Detection ---
test('No heavy JS in assets passes', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['app.js', 'styles.css', 'logo.png'],
    },
  });
  assertEqual(result.passed, true, 'Should pass');
});

test('d3 detected as heavy JS', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['d3.min.js', 'app.js'],
    },
  });
  assertEqual(result.passed, false, 'Should fail');
  assert(result.violations.some(v => v.includes('d3')), 'Violation should mention d3');
  assert(result.suggestions.some(s => s.includes('d3') || s.includes('heavy')), 'Suggestion should mention heavy');
});

test('three.js detected as heavy JS', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['three.module.js', 'app.js'],
    },
  });
  assertEqual(result.passed, false, 'Should fail');
  assert(result.violations.some(v => v.includes('three')), 'Violation should mention three');
});

test('phaser detected as heavy JS', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['phaser.min.js'],
    },
  });
  assertEqual(result.passed, false, 'Should fail');
});

test('plotly detected as heavy JS', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['plotly-2.0.js'],
    },
  });
  assertEqual(result.passed, false, 'Should fail');
});

test('moment.js detected as heavy JS', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['moment.min.js'],
    },
  });
  assertEqual(result.passed, false, 'Should fail');
});

test('Custom heavyJsPatterns work', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      assets: ['my-heavy-lib.js'],
    },
    budgets: {
      heavyJsPatterns: [/my-heavy-lib/i],
    },
  });
  assertEqual(result.passed, false, 'Should fail with custom pattern');
});

// --- Multiple Violations ---
test('Multiple violations are all reported', async () => {
  const result = await analyzePerformance({
    buildOutput: {
      totalSize: 600 * 1024,
      lighthouse: { performance: 80, lcp: 3000, cls: 0.2, tti: 4000 },
      assets: ['d3.min.js'],
    },
    budgets: {
      maxBundleSize: 500 * 1024,
      minLighthouseScore: 90,
      maxLCP: 2500,
      maxCLS: 0.1,
      maxTTI: 3500,
    },
  });
  assertEqual(result.passed, false, 'Should fail');
  assertEqual(result.violations.length, 6, 'Should have 6 violations');
  assertGreaterThan(result.suggestions.length, 0, 'Should have suggestions');
});

// --- Result Shape ---
test('Result has correct shape', async () => {
  const result = await analyzePerformance({
    buildOutput: { totalSize: 100 },
  });
  assert('passed' in result, 'Should have passed');
  assert(Array.isArray(result.violations), 'violations should be array');
  assert(typeof result.metrics === 'object', 'metrics should be object');
  assert(typeof result.metrics.bundleSize === 'number', 'bundleSize should be number');
  assert(typeof result.metrics.lighthouse === 'object', 'lighthouse should be object');
  assert(Array.isArray(result.suggestions), 'suggestions should be array');
});

// --- Async behavior ---
test('Returns a promise', () => {
  const result = analyzePerformance({ buildOutput: {} });
  assert(typeof result.then === 'function', 'Should return a promise');
});

// ============================================================
// Summary
// ============================================================
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.err.message}`);
  }
  process.exit(1);
} else {
  console.log('All tests passed!');
  process.exit(0);
}