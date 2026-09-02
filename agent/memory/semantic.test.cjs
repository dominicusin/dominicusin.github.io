'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSemanticStore } = require('./semantic.cjs');

function tmpFile() { return path.join(os.tmpdir(), `sem-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`); }

test('semantic index facts by capability/policy failure', () => {
  const store = createSemanticStore();
  store.addFact({ tags: ['a11y'], capability: 'a11y', fact: 'axe fails on contrast', failureType: 'A11Y_FAILURE', confidence: 0.9 });
  store.addFact({ tags: ['perf'], capability: 'performance', fact: 'bundle too large', failureType: 'BUILD_FAILURE', confidence: 0.7 });
  assert.equal(store.queryByCapability('a11y').length, 1);
  assert.equal(store.queryByPolicyFailure('A11Y_FAILURE').length, 1);
  assert.equal(store.queryByPolicyFailure('BUILD_FAILURE')[0].fact, 'bundle too large');
});

test('query by tags returns ranked facts', () => {
  const store = createSemanticStore();
  store.addFact({ id: 'f1', tags: ['a', 'b'], fact: 'fact 1', confidence: 0.5 });
  store.addFact({ id: 'f2', tags: ['a', 'b', 'c'], fact: 'fact 2', confidence: 0.9 });
  store.addFact({ id: 'f3', tags: ['a'], fact: 'fact 3', confidence: 0.8 });
  const ranked = store.queryByTags(['a', 'b']);
  assert.equal(ranked[0].id, 'f2');
  assert.equal(ranked[1].id, 'f1');
  assert.equal(ranked[2].id, 'f3');
});

test('no mutable global state - isolated instances', () => {
  const s1 = createSemanticStore();
  const s2 = createSemanticStore();
  s1.addFact({ tags: ['x'], fact: 'only in s1' });
  assert.equal(s1.size, 1);
  assert.equal(s2.size, 0);
  assert.equal(s2.queryByTags(['x']).length, 0);
});

test('persistence and no data loss', () => {
  const fp = tmpFile();
  const s1 = createSemanticStore({ filePath: fp });
  s1.addFact({ id: 'p1', tags: ['t'], fact: 'persisted' });
  const s2 = createSemanticStore({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 1);
  assert.equal(s2.get('p1').fact, 'persisted');
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});

test('remove and list sorted', () => {
  const store = createSemanticStore();
  store.addFact({ id: 'r1', tags: [], fact: 'to remove' });
  assert.ok(store.get('r1'));
  store.remove('r1');
  assert.equal(store.get('r1'), null);
});
