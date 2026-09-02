'use strict';

/**
 * Architect Agent Tests — M3-001
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { analyzeArchitecture } = require('../workers/architect/architect.cjs');

test('analyzeArchitecture returns valid report', async () => {
  const result = await analyzeArchitecture({
    repository: '.',
    adr: [],
    boundaries: {}
  });

  assert.ok('valid' in result);
  assert.ok('drift' in result);
  assert.ok('violations' in result);
  assert.ok('recommendations' in result);
  assert.ok(Array.isArray(result.drift));
  assert.ok(Array.isArray(result.violations));
});

test('analyzeArchitecture detects no issues in clean repo', async () => {
  const result = await analyzeArchitecture({
    repository: '.',
    adr: ['docs/adr/0001-test.md'],
    boundaries: {}
  });

  assert.ok(result.valid);
  assert.deepEqual(result.violations, []);
});
