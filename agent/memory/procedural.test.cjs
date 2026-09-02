'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createProceduralStore } = require('./procedural.cjs');

function tmpFile() { return path.join(os.tmpdir(), `proc-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`); }

const sampleStages = [
  { name: 'research', workers: ['researcher'], parallel: false },
  { name: 'implement', workers: ['implementer'], parallel: false },
  { name: 'verify', workers: ['tester', 'security'], parallel: true }
];

test('procedural stores workflow templates Task->Stages', () => {
  const store = createProceduralStore();
  const tpl = store.saveTemplate({ id: 'tpl-1', stages: sampleStages });
  assert.ok(tpl.id, 'tpl-1');
  assert.deepEqual(tpl.stages, sampleStages);
  assert.equal(store.getTemplate('tpl-1').id, 'tpl-1');
});

test('template reuse produces identical ExecutionPlan', () => {
  const store = createProceduralStore();
  store.saveTemplate({ id: 'tpl-reuse', stages: sampleStages });
  const p1 = store.reuseTemplate('tpl-reuse', { task: 'T1' });
  const p2 = store.reuseTemplate('tpl-reuse', { task: 'T1' });
  assert.deepEqual(p1.stages, p2.stages);
  assert.equal(p1.templateId, p2.templateId);
  p1.stages[0].name = 'mutated';
  const p3 = store.reuseTemplate('tpl-reuse', { task: 'T1' });
  assert.equal(p3.stages[0].name, 'research');
});

test('versioned templates', () => {
  const store = createProceduralStore();
  const v1 = store.saveTemplate({ id: 'ver-tpl', version: 1, stages: [{ name: 'v1' }] });
  const v2 = store.saveTemplate({ id: 'ver-tpl', version: 2, stages: [{ name: 'v2' }] });
  assert.equal(v1.version, 1);
  assert.equal(v2.version, 2);
  assert.equal(store.getTemplate('ver-tpl', 1).stages[0].name, 'v1');
  assert.equal(store.getTemplate('ver-tpl', 2).stages[0].name, 'v2');
  assert.equal(store.getTemplate('ver-tpl').version, 2);
});

test('auto version increment', () => {
  const store = createProceduralStore();
  store.saveTemplate({ id: 'auto-v', stages: [{ name: 'a' }] });
  store.saveTemplate({ id: 'auto-v', stages: [{ name: 'b' }] });
  assert.equal(store.listTemplates().filter(t => t.id === 'auto-v').length, 2);
  assert.equal(store.getTemplate('auto-v').stages[0].name, 'b');
});

test('persistence', () => {
  const fp = tmpFile();
  const s1 = createProceduralStore({ filePath: fp });
  s1.saveTemplate({ id: 'persist-tpl', stages: sampleStages });
  const s2 = createProceduralStore({ filePath: fp });
  s2.load();
  assert.equal(s2.size, 1);
  assert.ok(s2.getTemplate('persist-tpl'));
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
});
