'use strict';

/**
 * Worker Contract Tests — M1-010 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { validateWorkerResult } = require('../workers/contracts/worker-contract.cjs');

test('validates correct worker result', () => {
  const result = {
    status: 'success',
    changes: { files: ['test.js'], summary: 'done' },
    verification: [{ command: 'npm test', exit_code: 0 }],
    evidence: [],
    risks: [],
    next_action: 'review'
  };

  const validation = validateWorkerResult(result);
  assert.equal(validation.valid, true);
});

test('rejects invalid status', () => {
  const result = {
    status: 'invalid',
    changes: { files: [], summary: '' },
    verification: [],
    evidence: [],
    risks: [],
    next_action: 'continue'
  };

  const validation = validateWorkerResult(result);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('status')));
});

test('rejects non-array files', () => {
  const result = {
    status: 'success',
    changes: { files: 'not-array', summary: '' },
    verification: [],
    evidence: [],
    risks: [],
    next_action: 'continue'
  };

  const validation = validateWorkerResult(result);
  assert.equal(validation.valid, false);
});

test('rejects missing summary', () => {
  const result = {
    status: 'success',
    changes: { files: [] },
    verification: [],
    evidence: [],
    risks: [],
    next_action: 'continue'
  };

  const validation = validateWorkerResult(result);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('summary')));
});
