'use strict';

/**
 * Planner Agent Tests — M3-009
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { PlannerAgent } = require('../workers/planner/planner.cjs');

test('createPlan generates tasks from initiative', () => {
  const planner = new PlannerAgent({ repository: '.', beads: {} });
  const plan = planner.createPlan({
    initiative: { id: 'test', description: 'Implement new feature' },
    state: {},
    constraints: {}
  });

  assert.ok(plan.tasks.length > 0);
  assert.ok(plan.metadata.totalTasks > 0);
});

test('createPlan identifies epics from description', () => {
  const planner = new PlannerAgent({ repository: '.', beads: {} });
  const plan = planner.createPlan({
    initiative: { id: 'test', description: 'Research and implement performance optimization' },
    state: {},
    constraints: {}
  });

  const epicPrefixes = new Set(plan.tasks.map(t => t.id.split('-')[0]));
  assert.ok(epicPrefixes.size >= 1);
});

test('createPlan creates dependencies between epics', () => {
  const planner = new PlannerAgent({ repository: '.', beads: {} });
  const plan = planner.createPlan({
    initiative: { id: 'test', description: 'Research and implement new feature' },
    state: {},
    constraints: {}
  });

  assert.ok(plan.edges.length > 0);
});

test('createPlan estimates risk level', () => {
  const planner = new PlannerAgent({ repository: '.', beads: {} });
  const plan = planner.createPlan({
    initiative: { id: 'test', description: 'Update documentation' },
    state: {},
    constraints: {}
  });

  assert.ok(['R0', 'R1', 'R2', 'R3', 'R4'].includes(plan.metadata.estimatedRisk));
});
