'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createIntelligenceFacade } = require('./index.cjs');

test('facade getIntelligence returns {graph,impact,hotspots,ownership} cached per commit SHA no mutation', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'intel-'));
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src', 'a.js'), "import './b.js';\n");
  fs.writeFileSync(path.join(tmp, 'src', 'b.js'), "");
  fs.mkdirSync(path.join(tmp, '.beads'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.beads', 'beads.json'), JSON.stringify({ nodes: [{ id: 'T1', artifacts: ['src/a.js'] }] }));
  const facade = createIntelligenceFacade({ rootDir: tmp });
  const r1 = facade.getIntelligence({ diff: ['src/a.js'], commitSha: 'a'.repeat(40) });
  assert.ok(r1.graph && r1.impact && r1.hotspots && r1.ownership);
  assert.ok(Array.isArray(r1.impact.affected_paths));
  assert.ok(typeof r1.impact.risk_score === 'string');
  assert.ok(Array.isArray(r1.impact.required_workers));
  const r2 = facade.getIntelligence({ diff: ['src/a.js'], commitSha: 'a'.repeat(40) });
  assert.equal(r1, r2, 'cached same object');
  const r3 = facade.getIntelligence({ diff: ['src/b.js'], commitSha: 'b'.repeat(40) });
  assert.notEqual(r1, r3);
  const before = fs.readdirSync(tmp).length;
  facade.getIntelligence({ diff: ['src/a.js'], commitSha: 'a'.repeat(40) });
  const after = fs.readdirSync(tmp).length;
  assert.equal(before, after, 'no filesystem mutation');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('facade validates memory not source of truth', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'intel2-'));
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src', 'a.js'), "");
  const facade = createIntelligenceFacade({ rootDir: tmp });
  const r = facade.getIntelligence({ diff: ['src/a.js'], commitSha: 'c'.repeat(40) });
  assert.ok(r.graph);
  assert.ok(r.validateAgainstCode, 'has validator');
  fs.rmSync(tmp, { recursive: true, force: true });
});
