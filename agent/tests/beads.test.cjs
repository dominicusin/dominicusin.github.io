'use strict';

/**
 * Beads Adapter Tests — M1-007 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { loadGraph, getReadyTasks, getBlockedTasks, transitionTask, validateGraph } = require('../orchestrator/beads.cjs');
const path = require('path');

const FIXTURES = path.resolve(__dirname, 'fixtures');

test('task with no dependencies is READY', () => {
  const graph = loadGraph(path.join(FIXTURES, 'beads.json'));
  const ready = getReadyTasks(graph);
  const ids = ready.map(t => t.id);

  assert.ok(ids.includes('TEST-1'));
  assert.ok(!ids.includes('TEST-2')); // has dep on TEST-1 which is pending
  assert.ok(!ids.includes('TEST-3')); // already done
});

test('task with unfinished dependency is not READY', () => {
  const graph = loadGraph(path.join(FIXTURES, 'beads.json'));
  const ready = getReadyTasks(graph);
  const blocked = getBlockedTasks(graph);

  assert.ok(!ready.some(t => t.id === 'TEST-2'));
  assert.ok(blocked.some(t => t.id === 'TEST-2'));
});

test('validateGraph detects missing nodes', () => {
  const badGraph = { schema: 'test', nodes: [{ id: 'A', status: 'pending' }] };
  const result = validateGraph(badGraph);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('deps')));
});

test('transitionTask updates status correctly', () => {
  const graph = loadGraph(path.join(FIXTURES, 'beads.json'));
  transitionTask(graph, 'TEST-1', 'in_progress');

  const node = graph.nodes.find(n => n.id === 'TEST-1');
  assert.equal(node.status, 'in_progress');
});

test('transitionTask throws on missing task', () => {
  const graph = loadGraph(path.join(FIXTURES, 'beads.json'));
  assert.throws(() => transitionTask(graph, 'NONEXISTENT', 'done'));
});

test('getReadyTasks returns empty when all tasks done or blocked', () => {
  const graph = {
    nodes: [
      { id: 'A', status: 'done', deps: [] },
      { id: 'B', status: 'in_progress', deps: [] },
      { id: 'C', status: 'pending', deps: ['B'] }
    ]
  };

  const ready = getReadyTasks(graph);
  assert.deepEqual(ready, []);
});
