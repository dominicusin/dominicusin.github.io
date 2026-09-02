'use strict';

/**
 * Verification Runner Tests — M2-005 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { runVerification, runVerifications } = require('../evidence/verification.cjs');

test('successful command returns exit_code 0', async () => {
  const result = await runVerification({ command: 'echo hello' });

  assert.equal(result.exit_code, 0);
  assert.ok(result.stdout.includes('hello'));
  assert.ok(result.evidence.stdout_hash.length === 64);
});

test('failed command returns non-zero exit_code', async () => {
  const result = await runVerification({ command: 'exit 1' });

  assert.notEqual(result.exit_code, 0);
});

test('runVerifications passes when all commands succeed', async () => {
  const { passed, results } = await runVerifications([
    { command: 'echo first' },
    { command: 'echo second' }
  ]);

  assert.equal(passed, true);
  assert.equal(results.length, 2);
});

test('runVerifications fails when any command fails', async () => {
  const { passed, results } = await runVerifications([
    { command: 'echo ok' },
    { command: 'exit 1' }
  ]);

  assert.equal(passed, false);
  assert.equal(results.length, 2);
});
