'use strict';

/**
 * Orchestrator Integration Test — M1-013
 * Tests the full audit → select → policy → claim → worktree → worker → verify → evidence → state cycle.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { Orchestrator } = require('../orchestrator/index.cjs');
const { PolicyEngine } = require('../policy/policy.cjs');
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
 * Create a mock worktree that doesn't actually create git worktrees.
 */
function createMockWorktree(taskId) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `wt-${taskId}-`));
  return {
    path: tmpDir,
    branch: `agent/${taskId}`,
    cleanup: () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  };
}

test('orchestrator runs full cycle: audit → select → policy → claim → worktree → worker → verify → done', async () => {
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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm1-013-'));
  const beadsPath = path.join(tmpDir, 'beads.json');
  fs.writeFileSync(beadsPath, JSON.stringify(beadsGraph, null, 2));

  try {
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

    // Override worktree creation to use mock
    const wt = require('../orchestrator/worktree.cjs');
    const origCreate = wt.createWorktree;
    wt.createWorktree = (params) => createMockWorktree(params.taskId);

    let result;
    try {
      result = await orchestrator.runOnce();
    } finally {
      wt.createWorktree = origCreate;
    }

    assert.equal(result.status, 'success');
    assert.equal(result.task.status, 'DONE');
    assert.equal(result.policy.allowed, true);

  } finally {
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
