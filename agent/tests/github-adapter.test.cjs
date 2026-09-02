'use strict';

/**
 * GitHub Adapter Tests — M2-001 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { createPR, updatePR, closePR, getChecks, mergePR } = require('../adapters/github.cjs');

test('createPR is a function', () => {
  assert.equal(typeof createPR, 'function');
});

test('updatePR is a function', () => {
  assert.equal(typeof updatePR, 'function');
});

test('closePR is a function', () => {
  assert.equal(typeof closePR, 'function');
});

test('getChecks is a function', () => {
  assert.equal(typeof getChecks, 'function');
});

test('mergePR is a function', () => {
  assert.equal(typeof mergePR, 'function');
});

test('createPR accepts { head, base, title, body } and returns a Promise', async () => {
  const result = createPR({
    head: 'feature-branch',
    base: 'main',
    title: 'Test PR',
    body: 'Test body'
  });
  assert.ok(result instanceof Promise);
  // We don't await here to avoid actual GitHub calls in unit tests
});

test('updatePR accepts prNumber and { title, body } and returns a Promise', async () => {
  const result = updatePR(42, { title: 'Updated title', body: 'Updated body' });
  assert.ok(result instanceof Promise);
});

test('closePR accepts prNumber and returns a Promise', async () => {
  const result = closePR(42);
  assert.ok(result instanceof Promise);
});

test('getChecks accepts prNumber and returns a Promise', async () => {
  const result = getChecks(42);
  assert.ok(result instanceof Promise);
});

test('mergePR accepts prNumber and method and returns a Promise', async () => {
  const result = mergePR(42, 'merge');
  assert.ok(result instanceof Promise);
});

test('createPR rejects with missing head', async () => {
  await assert.rejects(
    createPR({ base: 'main', title: 'Test', body: 'Body' }),
    /head is required/
  );
});

test('createPR rejects with missing base', async () => {
  await assert.rejects(
    createPR({ head: 'feature', title: 'Test', body: 'Body' }),
    /base is required/
  );
});

test('createPR rejects with missing title', async () => {
  await assert.rejects(
    createPR({ head: 'feature', base: 'main', body: 'Body' }),
    /title is required/
  );
});

test('updatePR rejects with invalid prNumber', async () => {
  await assert.rejects(
    updatePR('abc', { title: 'Test' }),
    /prNumber must be a positive integer/
  );
});

test('closePR rejects with invalid prNumber', async () => {
  await assert.rejects(
    closePR(0),
    /prNumber must be a positive integer/
  );
});

test('mergePR rejects with invalid method', async () => {
  await assert.rejects(
    mergePR(42, 'invalid-method'),
    /method must be one of/
  );
});

test('getChecks rejects with invalid prNumber', async () => {
  await assert.rejects(
    getChecks(-1),
    /prNumber must be a positive integer/
  );
});
