'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createEpisodicStore } = require('./episodic.cjs');

function tmpFile() { return path.join(os.tmpdir(), `ep-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`); }

test('episodic append and query by run_id+task_id', () => {
  const store = createEpisodicStore();
  const ep1 = store.append({ runId: 'run-1', taskId: 'T1', payload: { step: 1 } });
  const ep2 = store.append({ runId: 'run-1', taskId: 'T2', payload: { step: 2 } });
  const ep3 = store.append({ runId: 'run-2', taskId: 'T1', payload: { step: 3 } });
  assert.equal(store.query({ runId: 'run-1', taskId: 'T1' }).length, 1);
  assert.equal(store.query({ runId: 'run-1', taskId: 'T1' })[0].id, ep1.id);
  assert.equal(store.queryByRun('run-1').length, 2);
  assert.equal(store.queryByTask('T1').length, 2);
  assert.equal(store.list().length, 3);
});

test('retention window enforced', () => {
  const fp = tmpFile();
  const store = createEpisodicStore({ filePath: fp, retentionDays: 1 });
  const old = store.append({ runId: 'r1', taskId: 't1' });
  old.timestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fresh = store.append({ runId: 'r1', taskId: 't1' });
  const removed = store.prune();
  assert.equal(removed, 1);
  assert.equal(store.get(old.id), null);
  assert.ok(store.get(fresh.id));
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});

test('evidence correlation', () => {
  const store = createEpisodicStore();
  const ep = store.append({ runId: 'run-x', taskId: 'T-x' });
  const evidence = { evidence: 'ev-123', command: 'npm test', exit_code: 0 };
  const correlated = store.correlate(ep.id, evidence);
  assert.ok(correlated.evidenceIds.includes('ev-123'));
  assert.deepEqual(correlated.evidence, evidence);
  assert.equal(store.query({ runId: 'run-x', taskId: 'T-x' })[0].evidenceIds.length, 1);
});

test('persistence no loss on restart', () => {
  const fp = tmpFile();
  const s1 = createEpisodicStore({ filePath: fp });
  s1.append({ runId: 'rA', taskId: 'tA' });
  s1.append({ runId: 'rB', taskId: 'tB' });
  const s2 = createEpisodicStore({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 2);
  assert.equal(s2.queryByRun('rA').length, 1);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});

test('maxEntries enforced', () => {
  const store = createEpisodicStore({ maxEntries: 2 });
  store.append({ runId: 'r1', taskId: 't1' });
  store.append({ runId: 'r1', taskId: 't1' });
  store.append({ runId: 'r1', taskId: 't1' });
  assert.equal(store.size, 2);
});
