'use strict';

const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateMemoryEntry, createMemoryStore } = require('./memory.cjs');

function tmpFile() {
  return path.join(os.tmpdir(), `mem-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
}

const validEntry = {
  id: 'm-1',
  task: 'M4-001',
  run_id: 'run-1',
  payload: { foo: 'bar' },
  timestamp: new Date().toISOString()
};

test('validateMemoryEntry accepts valid entry', () => {
  const r = validateMemoryEntry(validEntry);
  assert.equal(r.valid, true);
});

test('validateMemoryEntry rejects missing fields', () => {
  const r = validateMemoryEntry({ id: '', task: '', run_id: '', payload: null, timestamp: 'bad' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.length >= 3);
});

test('createMemoryStore set/get/list in memory', () => {
  const store = createMemoryStore();
  store.set({ ...validEntry, id: 'a1' });
  assert.equal(store.get('a1').task, 'M4-001');
  assert.equal(store.list().length, 1);
  assert.equal(store.size, 1);
});

test('createMemoryStore persistence no data loss on restart', () => {
  const fp = tmpFile();
  const s1 = createMemoryStore({ filePath: fp });
  s1.set({ ...validEntry, id: 'p1', task: 'T1', run_id: 'r1' });
  s1.set({ ...validEntry, id: 'p2', task: 'T2', run_id: 'r2' });
  assert.equal(fs.existsSync(fp), true);
  const s2 = createMemoryStore({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 2);
  assert.ok(s2.get('p1'));
  assert.ok(s2.get('p2'));
  fs.unlinkSync(fp);
});

test('createMemoryStore load/save/get/set/list with JSONL persistence', () => {
  const fp = tmpFile();
  const s = createMemoryStore({ filePath: fp });
  s.set({ ...validEntry, id: 'x1' });
  s.save();
  const raw = fs.readFileSync(fp, 'utf8');
  assert.ok(raw.includes('"x1"'));
  const lines = raw.trim().split('\n');
  assert.equal(lines.length, 1);
  assert.doesNotThrow(() => JSON.parse(lines[0]));
  fs.unlinkSync(fp);
});

test('set throws on invalid entry', () => {
  const store = createMemoryStore();
  assert.throws(() => store.set({ id: '', task: 't', run_id: 'r', payload: {}, timestamp: new Date().toISOString() }));
});

test('delete and clear', () => {
  const store = createMemoryStore();
  store.set({ ...validEntry, id: 'd1' });
  store.set({ ...validEntry, id: 'd2' });
  store.delete('d1');
  assert.equal(store.has('d1'), false);
  assert.equal(store.size, 1);
  store.clear();
  assert.equal(store.size, 0);
});

test('validateAgainstSource detects not source of truth', () => {
  const store = createMemoryStore();
  store.set({ ...validEntry, id: 'v1', task: 'UNKNOWN_TASK' });
  const graph = { nodes: [{ id: 'M4-001' }] };
  const r = store.validateAgainstSource(graph);
  assert.equal(r.valid, false);
  assert.equal(r.isSourceOfTruth, false);
  assert.ok(r.errors.some(e => e.includes('UNKNOWN_TASK')));
  const r2 = store.validateAgainstSource({ nodes: [{ id: 'UNKNOWN_TASK' }] });
  assert.equal(r2.valid, true);
});
