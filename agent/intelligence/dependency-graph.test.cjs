'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { buildDependencyGraph, detectCycles, transitiveClosure, getDependents } = require('./dependency-graph.cjs');

function sampleGraph() {
  return {
    nodes: [
      { id: 'src/a.js', type: 'file', module: 'src' },
      { id: 'src/b.js', type: 'file', module: 'src' },
      { id: 'src/c.js', type: 'file', module: 'src' },
      { id: 'package:lodash', type: 'package' }
    ],
    edges: [
      { from: 'src/a.js', to: 'src/b.js', type: 'imports' },
      { from: 'src/b.js', to: 'src/c.js', type: 'imports' },
      { from: 'src/a.js', to: 'package:lodash', type: 'depends' }
    ]
  };
}

test('dependency-graph builds DAG of package/file deps', () => {
  const g = buildDependencyGraph(sampleGraph(), { dependencies: { lodash: '^4' } });
  assert.ok(g.nodes.some(n => n.id === 'package:lodash'));
  assert.ok(g.edges.length >= 3);
  assert.equal(g.meta.totalPackages, 1);
});

test('cycle detection reports culprit edge', () => {
  const cyclic = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }]
  };
  const dg = buildDependencyGraph(cyclic, {});
  const res = detectCycles(dg);
  assert.equal(res.hasCycle, true);
  assert.ok(Array.isArray(res.cycles) && res.cycles.length > 0);
  assert.ok(res.culpritEdge, 'culprit edge present');
  assert.ok(res.culpritEdge.from && res.culpritEdge.to);
});

test('transitive closure correct', () => {
  const g = buildDependencyGraph(sampleGraph(), {});
  const closure = transitiveClosure(g, 'src/a.js');
  assert.ok(closure.has('src/b.js'));
  assert.ok(closure.has('src/c.js'));
  assert.ok(closure.has('package:lodash'));
  assert.ok(!closure.has('src/a.js'));
});

test('getDependents returns reverse dependencies', () => {
  const g = buildDependencyGraph(sampleGraph(), {});
  const deps = getDependents(g, 'src/c.js');
  assert.ok(deps.includes('src/b.js'));
  assert.ok(deps.includes('src/a.js'));
});

test('acyclic graph detectCycles false', () => {
  const g = buildDependencyGraph(sampleGraph(), {});
  const r = detectCycles(g);
  assert.equal(r.hasCycle, false);
  assert.equal(r.cycles.length, 0);
  assert.equal(r.culpritEdge, null);
});
