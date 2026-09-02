'use strict';

/**
 * Self-Improving Factory Tests — M3-005
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { SelfImprovingFactory } = require('../workers/self-improving/factory.cjs');

test('analyze returns improvements for high failure rate', () => {
  const factory = new SelfImprovingFactory({ repository: '.', beads: {} });
  factory.metrics = {
    tasksCompleted: 5,
    tasksFailed: 5,
    retriesUsed: 10,
    averageRetries: 2,
    escapedDefects: 0
  };

  const improvements = factory.analyze();
  assert.ok(improvements.length > 0);
  assert.ok(improvements.some(i => i.type === 'reliability'));
});

test('analyze returns no improvements for good metrics', () => {
  const factory = new SelfImprovingFactory({ repository: '.', beads: {} });
  factory.metrics = {
    tasksCompleted: 100,
    tasksFailed: 5,
    retriesUsed: 10,
    averageRetries: 0.1,
    escapedDefects: 0
  };

  const improvements = factory.analyze();
  assert.deepEqual(improvements, []);
});

test('updateMetrics tracks retries', () => {
  const factory = new SelfImprovingFactory({ repository: '.', beads: {} });

  factory.updateMetrics({ status: 'success' });
  factory.updateMetrics({ status: 'failed', retries: 2 });

  assert.equal(factory.metrics.tasksCompleted, 1);
  assert.equal(factory.metrics.tasksFailed, 1);
  assert.equal(factory.metrics.retriesUsed, 2);
});

test('generateTasks creates beads tasks from improvements', () => {
  const factory = new SelfImprovingFactory({ repository: '.', beads: {} });
  const improvements = [
    { type: 'test', severity: 'medium', description: 'Add tests', action: 'Fix' }
  ];

  const tasks = factory.generateTasks(improvements);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].status, 'pending');
});
