'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildRepositoryGraph, updateGraph, createSnapshot } = require('./repository-graph.cjs');

function mkTmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-graph-'));
  fs.mkdirSync(path.join(d, 'src'), { recursive: true });
  fs.writeFileSync(path.join(d, 'src', 'a.js'), "import b from './b.js';\nconst x=require('./c.cjs');\n");
  fs.writeFileSync(path.join(d, 'src', 'b.js'), "export default 1;\n");
  fs.writeFileSync(path.join(d, 'src', 'c.cjs'), "module.exports={};\n");
  fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ dependencies: { lodash: '^4' } }));
  fs.mkdirSync(path.join(d, 'agent', 'memory'), { recursive: true });
  fs.writeFileSync(path.join(d, 'agent', 'memory', 'memory.cjs'), "require('../evidence/evidence.cjs');\n");
  fs.mkdirSync(path.join(d, '.beads'), { recursive: true });
  fs.writeFileSync(path.join(d, '.beads', 'beads.json'), JSON.stringify({ nodes: [{ id: 'T1', artifacts: ['src/a.js'] }] }), 'utf8');
  return d;
}

test('buildRepositoryGraph nodes = files/modules edges = import/require', () => {
  const tmp = mkTmp();
  const g = buildRepositoryGraph(tmp);
  assert.ok(Array.isArray(g.nodes), 'nodes array');
  assert.ok(Array.isArray(g.edges), 'edges array');
  const fileNodes = g.nodes.filter(n => n.type === 'file');
  assert.ok(fileNodes.length >= 4, 'at least 4 file nodes');
  const modNodes = g.nodes.filter(n => n.type === 'module');
  assert.ok(modNodes.length >= 2, 'at least 2 modules');
  assert.ok(g.edges.length >= 2, 'import edges detected');
  assert.ok(g.edges.some(e => e.from.includes('a.js') && e.to.includes('b.js')), 'a->b edge');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('buildRepositoryGraph links Task->Files via beads artifacts', () => {
  const tmp = mkTmp();
  const g = buildRepositoryGraph(tmp);
  const taskEdges = g.edges.filter(e => e.type === 'task-owns');
  assert.ok(taskEdges.length >= 1, 'task edges exist');
  assert.ok(taskEdges.some(e => e.from === 'T1'), 'T1 owns file');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('incremental update on diff adds/removes nodes', () => {
  const tmp = mkTmp();
  let g = buildRepositoryGraph(tmp);
  const initialCount = g.nodes.length;
  fs.writeFileSync(path.join(tmp, 'src', 'new.js'), "import './a.js';\n");
  g = updateGraph(g, { added: ['src/new.js'], modified: [], removed: [] }, tmp);
  assert.ok(g.nodes.length > initialCount, 'node added');
  assert.ok(g.nodes.some(n => n.id === 'src/new.js'), 'new file node');
  g = updateGraph(g, { added: [], modified: [], removed: ['src/new.js'] }, tmp);
  fs.unlinkSync(path.join(tmp, 'src', 'new.js'));
  assert.ok(!g.nodes.some(n => n.id === 'src/new.js'), 'removed node gone');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('JSON serializable snapshot', () => {
  const tmp = mkTmp();
  const g = buildRepositoryGraph(tmp);
  const snap = createSnapshot(g);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(snap)));
  assert.ok(snap.timestamp);
  assert.ok(snap.nodes);
  assert.ok(typeof snap.hash === 'string' && snap.hash.length === 64);
  fs.rmSync(tmp, { recursive: true, force: true });
});
