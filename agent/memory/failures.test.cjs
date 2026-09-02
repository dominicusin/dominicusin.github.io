'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createFailureMemory } = require('./failures.cjs');

function tmpFile() { return path.join(os.tmpdir(), `fail-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`); }

test('failures.cjs indexes failure signature->diagnosis->healing', () => {
  const mem = createFailureMemory();
  const e = mem.indexFailure({ signature: 'sig-1', category: 'TEST_FAILURE', diagnosis: 'assertion failed', healing: 'fix assertion' });
  assert.equal(e.signature, 'sig-1');
  assert.equal(e.diagnosis, 'assertion failed');
  assert.equal(e.healing, 'fix assertion');
  assert.equal(mem.getBySignature('sig-1').category, 'TEST_FAILURE');
  assert.equal(mem.healingFor('sig-1'), 'fix assertion');
});

test('failure memory query by category', () => {
  const mem = createFailureMemory();
  mem.indexFailure({ signature: 's1', category: 'BUILD_FAILURE', diagnosis: 'd1', healing: 'h1' });
  mem.indexFailure({ signature: 's2', category: 'TEST_FAILURE', diagnosis: 'd2', healing: 'h2' });
  assert.equal(mem.queryByCategory('BUILD_FAILURE').length, 1);
  assert.equal(mem.queryByCategory('TEST_FAILURE').length, 1);
});

test('count increments on duplicate signature', () => {
  const mem = createFailureMemory();
  mem.indexFailure({ signature: 'dup', category: 'LINT_FAILURE', diagnosis: 'd', healing: 'h' });
  const e2 = mem.indexFailure({ signature: 'dup', category: 'LINT_FAILURE', diagnosis: 'd2', healing: 'h2' });
  assert.equal(e2.count, 2);
  assert.equal(mem.size, 1);
});

test('persistence', () => {
  const fp = tmpFile();
  const s1 = createFailureMemory({ filePath: fp });
  s1.indexFailure({ signature: 'persist-sig', category: 'TIMEOUT', diagnosis: 'timeout', healing: 'retry' });
  const s2 = createFailureMemory({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 1);
  assert.equal(s2.getBySignature('persist-sig').healing, 'retry');
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});

test('no shared mutable state', () => {
  const a = createFailureMemory();
  const b = createFailureMemory();
  a.indexFailure({ signature: 'x', category: 'UNKNOWN', diagnosis: 'd', healing: 'h' });
  assert.equal(a.size, 1);
  assert.equal(b.size, 0);
});
