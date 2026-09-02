'use strict';

/**
 * Worktree Adapter Tests — M1-011 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { createWorktree, removeWorktree, isIsolated } = require('../orchestrator/worktree.cjs');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

test('creates worktree with agent/ prefix branch', () => {
  const result = createWorktree({
    repository: REPO_ROOT,
    branch: 'main',
    taskId: 'TEST-WT-1'
  });

  assert.ok(result.path.includes('.worktrees/TEST-WT-1'));
  assert.ok(result.branch === 'agent/TEST-WT-1');
  assert.ok(fs.existsSync(result.path));

  // Cleanup
  result.cleanup();
  assert.ok(!fs.existsSync(result.path));
});

test('worktree is isolated from main', () => {
  const result = createWorktree({
    repository: REPO_ROOT,
    branch: 'main',
    taskId: 'TEST-WT-2'
  });

  assert.equal(isIsolated(result.path), true);

  // Cleanup
  result.cleanup();
});

test('cleanup removes worktree directory', () => {
  const result = createWorktree({
    repository: REPO_ROOT,
    branch: 'main',
    taskId: 'TEST-WT-3'
  });

  const wtPath = result.path;
  assert.ok(fs.existsSync(wtPath));

  removeWorktree(wtPath);
  assert.ok(!fs.existsSync(wtPath));
});
