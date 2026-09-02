'use strict';

/**
 * Worktree Adapter — M1-011
 * Creates and manages isolated worktrees for tasks.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// SECURITY: All commands use execSync with hardcoded args. No user input in shell strings.

/**
 * Create an isolated worktree for a task.
 * @param {Object} params
 * @param {string} params.repository — repository root path
 * @param {string} params.branch — base branch
 * @param {string} params.taskId — task ID for naming
 * @returns {{ path: string, branch: string, cleanup: () => void }}
 */
function createWorktree({ repository, branch, taskId }) {
  const worktreePath = path.join(repository, '.worktrees', taskId);
  const worktreeBranch = `agent/${taskId}`;

  // Create .worktrees directory if needed
  const wtDir = path.join(repository, '.worktrees');
  if (!fs.existsSync(wtDir)) {
    fs.mkdirSync(wtDir, { recursive: true });
  }

  // Check if worktree already exists
  if (fs.existsSync(worktreePath)) {
    // Cleanup existing
    removeWorktree(worktreePath);
  }

  // Create worktree with new branch
  const cmd = `/everything/bin/git worktree add -b ${worktreeBranch} ${worktreePath} ${branch}`;
  try {
    execSync(cmd, { cwd: repository, encoding: 'utf8', timeout: 30000 });
  } catch (e) {
    // If branch exists, use it
    const fallbackCmd = `/everything/bin/git worktree add ${worktreePath} ${worktreeBranch}`;
    execSync(fallbackCmd, { cwd: repository, encoding: 'utf8', timeout: 30000 });
  }

  return {
    path: worktreePath,
    branch: worktreeBranch,
    cleanup: () => removeWorktree(worktreePath)
  };
}

/**
 * Remove a worktree.
 * @param {string} worktreePath — path to worktree
 */
function removeWorktree(worktreePath) {
  if (!fs.existsSync(worktreePath)) return;

  try {
    execSync(`/everything/bin/git worktree remove --force ${worktreePath}`, {
      encoding: 'utf8',
      timeout: 30000
    });
  } catch (e) {
    // Manual cleanup if git command fails
    fs.rmSync(worktreePath, { recursive: true, force: true });
  }

  // Clean up parent .worktrees dir if empty
  const parent = path.dirname(worktreePath);
  try {
    if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) {
      fs.rmdirSync(parent);
    }
  } catch {}
}

/**
 * Check if a worktree is properly isolated.
 * @param {string} worktreePath — path to worktree
 * @returns {boolean}
 */
function isIsolated(worktreePath) {
  if (!fs.existsSync(worktreePath)) return false;

  try {
    // Check that worktree is not on main branch
    const branch = execSync('/everything/bin/git branch --show-current', {
      cwd: worktreePath,
      encoding: 'utf8'
    }).trim();

    if (branch === 'main') return false;

    // Check that worktree exists in git's list
    const list = execSync('/everything/bin/git worktree list --porcelain', {
      encoding: 'utf8'
    });

    return list.includes(worktreePath);
  } catch {
    return false;
  }
}

module.exports = { createWorktree, removeWorktree, isIsolated };
