'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildOwnershipMap, getOwner } = require('./ownership.cjs');

function tmpRepoWithCodeowners() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'own-'));
  fs.mkdirSync(path.join(d, '.github'), { recursive: true });
  fs.writeFileSync(path.join(d, '.github', 'CODEOWNERS'), '/src/ @team-frontend\n/agent/ @team-agent\n');
  fs.mkdirSync(path.join(d, 'src'), { recursive: true });
  fs.writeFileSync(path.join(d, 'src', 'a.js'), '1');
  fs.mkdirSync(path.join(d, 'agent', 'memory'), { recursive: true });
  fs.writeFileSync(path.join(d, 'agent', 'memory', 'x.cjs'), '1');
  return d;
}

test('ownership maps file->team/capability via CODEOWNERS', () => {
  const d = tmpRepoWithCodeowners();
  const m = buildOwnershipMap(d);
  const o = getOwner(m, 'src/a.js');
  assert.ok(o);
  assert.equal(o.team, '@team-frontend');
  assert.ok(o.capability);
  assert.equal(o.confidence, 'high');
  assert.ok(o.source === 'CODEOWNERS');
  fs.rmSync(d, { recursive: true, force: true });
});

test('fallback to most frequent committer when no CODEOWNERS match', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'own2-'));
  fs.mkdirSync(path.join(d, 'src'), { recursive: true });
  fs.writeFileSync(path.join(d, 'src', 'orphan.js'), 'x');
  const m = buildOwnershipMap(d, { gitHistory: { 'src/orphan.js': [{ author: 'alice', count: 5 }, { author: 'bob', count: 2 }] } });
  const o = getOwner(m, 'src/orphan.js');
  assert.ok(o);
  assert.equal(o.team, 'alice');
  assert.equal(o.confidence, 'medium');
  fs.rmSync(d, { recursive: true, force: true });
});

test('confidence metadata present and heuristic fallback', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'own3-'));
  fs.writeFileSync(path.join(d, 'unknown.txt'), '1');
  const m = buildOwnershipMap(d);
  const o = getOwner(m, 'unknown.txt');
  assert.ok(o);
  assert.ok(['high', 'medium', 'low'].includes(o.confidence));
  assert.ok(o.source);
  fs.rmSync(d, { recursive: true, force: true });
});

test('ownership provides capability mapping', () => {
  const d = tmpRepoWithCodeowners();
  const m = buildOwnershipMap(d);
  const o1 = getOwner(m, 'agent/memory/x.cjs');
  assert.equal(o1.team, '@team-agent');
  assert.ok(o1.capability.includes('agent') || o1.capability.length > 0);
  fs.rmSync(d, { recursive: true, force: true });
});
