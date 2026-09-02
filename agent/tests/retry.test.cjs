'use strict';

/**
 * Retry Engine Tests — M2-004 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { RetryEngine } = require('../orchestrator/retry.cjs');

test('first failure returns RETRY', () => {
  const engine = new RetryEngine(3);
  const sig = { type: 'TEST', command: 'test', exit_code: 1, normalized_error_hash: 'abc' };

  const decision = engine.decide({ attempt: 1, taskId: 'T1', failureSignature: sig });

  assert.equal(decision.action, 'RETRY');
  assert.equal(decision.attempt, 2);
});

test('same signature twice returns ESCALATE', () => {
  const engine = new RetryEngine(3);
  const sig = { type: 'TEST', command: 'test', exit_code: 1, normalized_error_hash: 'abc' };

  engine.decide({ attempt: 1, taskId: 'T1', failureSignature: sig });
  const decision = engine.decide({ attempt: 2, taskId: 'T1', failureSignature: sig });

  assert.equal(decision.action, 'ESCALATE');
});

test('changed signature returns RETRY', () => {
  const engine = new RetryEngine(3);
  const sig1 = { type: 'TEST', command: 'test', exit_code: 1, normalized_error_hash: 'abc' };
  const sig2 = { type: 'TEST', command: 'test', exit_code: 2, normalized_error_hash: 'def' };

  engine.decide({ attempt: 1, taskId: 'T1', failureSignature: sig1 });
  const decision = engine.decide({ attempt: 2, taskId: 'T1', failureSignature: sig2 });

  assert.equal(decision.action, 'RETRY');
});

test('exceeding maxRetries returns ESCALATE', () => {
  const engine = new RetryEngine(2);
  const sig = { type: 'TEST', command: 'test', exit_code: 1, normalized_error_hash: 'abc' };

  engine.decide({ attempt: 1, taskId: 'T1', failureSignature: sig });
  engine.decide({ attempt: 2, taskId: 'T1', failureSignature: sig });
  const decision = engine.decide({ attempt: 3, taskId: 'T1', failureSignature: sig });

  assert.equal(decision.action, 'ESCALATE');
});

test('RetryEngine.createSignature normalizes error output', () => {
  const sig = RetryEngine.createSignature({
    type: 'TEST_FAILURE',
    command: 'npm test',
    exitCode: 1,
    stderr: 'Error: test failed at line 42 in file /path/to/file.js'
  });

  assert.equal(sig.type, 'TEST_FAILURE');
  assert.equal(sig.command, 'npm test');
  assert.equal(sig.exit_code, 1);
  assert.equal(sig.normalized_error_hash.length, 64);
});
