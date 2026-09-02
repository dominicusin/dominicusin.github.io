'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createDecisionLog } = require('./decisions.cjs');

function tmpFile() { return path.join(os.tmpdir(), `dec-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`); }

test('decisions.cjs records Decision {task,options,chosen,rationale,evidence}', () => {
  const log = createDecisionLog();
  const d = log.record({ task: 'T1', options: ['a', 'b'], chosen: 'a', rationale: 'faster', evidence: { exit_code: 0 } });
  assert.equal(d.task, 'T1');
  assert.deepEqual(d.options, ['a', 'b']);
  assert.equal(d.chosen, 'a');
  assert.equal(d.rationale, 'faster');
  assert.ok(d.evidence);
  assert.ok(d.id);
});

test('decision replay deterministic', () => {
  const log = createDecisionLog();
  log.record({ task: 'T-replay', options: ['x'], chosen: 'x', rationale: '1' });
  log.record({ task: 'T-replay', options: ['y'], chosen: 'y', rationale: '2' });
  const r1 = log.replay('T-replay');
  const r2 = log.replay('T-replay');
  assert.deepEqual(r1, r2);
  assert.equal(r1.length, 2);
  assert.equal(r1[0].rationale, '1');
});

test('unknown≠false preserved', () => {
  const log = createDecisionLog();
  const d1 = log.record({ task: 'T-unknown', options: ['a'], chosen: 'a', evidence: null });
  const d2 = log.record({ task: 'T-unknown', options: ['a'], chosen: 'a', evidence: undefined });
  const d3 = log.record({ task: 'T-unknown', options: ['a'], chosen: 'a', evidence: false });
  assert.equal(d1.evidence, null);
  assert.equal(d2.evidence, null);
  assert.equal(d3.evidence, false);
  assert.notEqual(d1.evidence, false);
});

test('persistence', () => {
  const fp = tmpFile();
  const s1 = createDecisionLog({ filePath: fp });
  s1.record({ task: 'T-persist', options: ['a'], chosen: 'a' });
  const s2 = createDecisionLog({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 1);
  assert.equal(s2.list()[0].task, 'T-persist');
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});

test('list filter and get', () => {
  const log = createDecisionLog();
  const d = log.record({ task: 'FILTER', options: ['a'], chosen: 'a' });
  assert.ok(log.get(d.id));
  assert.equal(log.queryByTask('FILTER').length, 1);
  assert.equal(log.queryByTask('OTHER').length, 0);
});
