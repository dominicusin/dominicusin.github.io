'use strict';

/**
 * Orchestrator Integration Test — M1-013
 * Tests the full audit → select → policy → claim → worktree → worker → verify → evidence → state cycle.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { Orchestrator } = require('../orchestrator/index.cjs');
const { PolicyEngine } = require('../policy/policy.cjs');
const { loadGraph } = require('../orchestrator/beads.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FIXTURES = path.resolve(__dirname, 'fixtures');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Create a mock worker that succeeds without LLM.
 */
function createMockWorker(result = { status: 'success', summary: 'mock implementation' }) {
  return async (context) => {
    // Simulate some work
    const filePath = path.join(context.workspace, 'mock-output.txt');
    fs.writeFileSync(filePath, `Mock work for task: ${context.task.id}\n`);

    return {
      status: result.status,
      changes: {
        files: ['mock-output.txt'],
        summary: result.summary
      },
      verification: [
        { command: 'echo verification-ok', exit_code: 0 }
      ],
      evidence: [],
      risks: [],
      next_action: 'review'
    };
  };
}

/**
 * Create a mock worker that fails.
 */
function createFailingWorker() {
  return async (context) => {
    return {
      status: 'failed',
      changes: { files: [], summary: 'mock failure' },
      verification: [],
      evidence: [],
      risks: ['mock risk'],
      next_action: 'escalate'
    };
  };
}

test('orchestrator runs full cycle: audit → select → policy → claim → worktree → worker → verify → done', async () => {
  // Setup: Create a beads graph with a READY task
  const beadsGraph = {
    schema: 'beads.state-graph/v1',
    project: 'test',
    initiative: 'test-m1-013',
    updated: new Date().toISOString(),
    nodes: [
      {
        id: 'M1-013-TEST',
        kind: 'task',
        title: 'Integration test task',
        status: 'pending',
        deps: [],
        artifacts: ['test-output.txt'],
        risk: 'R1',
        pr: null
      }
    ],
    edges: []
  };

  // Write fixture
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-013-'));
  const beadsPath = path.join(tmpDir, 'beads.json');
  fs.writeFileSync(beadsPath, JSON.stringify(beadsGraph, null, 2));

  try {
    // Create orchestrator with mock worker
    const policy = new PolicyEngine();
    const workers = {
      default: createMockWorker(),
      audit: async (repoRoot) => ({
        snapshot: {
          git: { commit: 'a'.repeat(40), branch: 'main', clean: true }
        }
      })
    };

    const orchestrator = new Orchestrator({
      repositoryRoot: REPO_ROOT,
      beadsPath,
      policy,
      workers,
      evidence: { createEvidence: () => ({}) }
    });

    // Run the orchestrator
    const result = await orchestrator.runOnce();

    // Verify result
    assert.equal(result.status, 'success');
    assert.equal(result.task.status, 'DONE');
    assert.equal(result.policy.allowed, true);

    // Verify worktree was created and cleaned up
    const worktreePath = path.join(REPO_ROOT, '.worktrees', 'M1-013-TEST');
    assert.ok(!fs.existsSync(worktreePath), 'worktree should be cleaned up');

  } finally {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('orchestrator returns no_ready_tasks when all tasks are done', async () => {
  const beadsGraph = {
    schema: 'beads.state-graph/v1',
    nodes: [
      { id: 'DONE-1', status: 'done', deps: [], artifacts: [] }
    ],
    edges: []
  };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-013-'));
  const beadsPath = path.join(tmpDir, 'beads.json');
  fs.writeFileSync(beadsPath, JSON.stringify(beadsGraph, null, 2));

  try {
    const policy = new PolicyEngine();
    const orchestrator = new Orchestrator({
      repositoryRoot: REPO_ROOT,
      beadsPath,
      policy,
      workers: {
        default: createMockWorker(),
        audit: async () => ({ snapshot: {} })
      },
      evidence: { createEvidence: () => ({}) }
    });

    const result = await orchestrator.runOnce();
    assert.equal(result.status, 'no_ready_tasks');

  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('orchestrator denies R4 tasks via policy', async () => {
  const beadsGraph = {
    schema: 'beads.state-graph/v1',
    nodes: [
      {
        id: 'R4-TEST',
        status: 'pending',
        deps: [],
        artifacts: ['secrets.json'],
        risk: 'R4',
        pr: null
      }
    ],
    edges: []
  };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-013-'));
  const beadsPath = path.join(tmpDir, 'beads.json');
  fs.writeFileSync(beadsPath, JSON.stringify(beadsGraph, null, 2));

  try {
    const policy = new PolicyEngine();
    const orchestrator = new Orchestrator({
      repositoryRoot: REPO_ROOT,
      beadsPath,
      policy,
      workers: {
        default: createMockWorker(),
        audit: async () => ({ snapshot: {} })
      },
      evidence: { createEvidence: () => ({}) }
    });

    const result = await orchestrator.runOnce();
    assert.equal(result.status, 'policy_denied');
    assert.ok(result.reasons.some(r => r.includes('human')));

  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
