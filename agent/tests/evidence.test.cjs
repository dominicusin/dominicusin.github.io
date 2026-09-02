'use strict';

/**
 * Evidence Contract Tests — M1-001 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { createEvidence, verifyEvidence } = require('../evidence/evidence.cjs');

test('creates evidence with SHA-256 stdout hash', () => {
  const record = createEvidence({
    command: 'printf hello',
    exitCode: 0,
    commit: 'a'.repeat(40),
    stdout: 'hello',
    startedAt: 1000,
    finishedAt: 1100
  });

  assert.equal(record.exit_code, 0);
  assert.equal(record.commit, 'a'.repeat(40));
  assert.equal(record.duration_ms, 100);
  assert.equal(record.stdout_hash.length, 64);
});

test('verifyEvidence accepts valid record', () => {
  const record = createEvidence({
    command: 'npm test',
    exitCode: 0,
    commit: 'b'.repeat(40),
    stdout: 'tests passed',
    startedAt: 0,
    finishedAt: 5000
  });

  const result = verifyEvidence(record);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('verifyEvidence rejects invalid commit length', () => {
  const record = {
    command: 'test',
    exit_code: 0,
    commit: 'too-short',
    timestamp: '2026-01-01T00:00:00Z',
    stdout_hash: 'a'.repeat(64),
    duration_ms: 100
  };

  const result = verifyEvidence(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('commit')));
});

test('verifyEvidence rejects negative duration', () => {
  const record = createEvidence({
    command: 'test',
    exitCode: 0,
    commit: 'c'.repeat(40),
    stdout: '',
    startedAt: 1000,
    finishedAt: 500
  });

  const result = verifyEvidence(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('duration')));
});

test('createEvidence rejects empty command', () => {
  assert.throws(() => {
    createEvidence({
      command: '',
      exitCode: 0,
      commit: 'd'.repeat(40),
      stdout: '',
      startedAt: 0,
      finishedAt: 100
    });
  }, /non-empty string/);
});
