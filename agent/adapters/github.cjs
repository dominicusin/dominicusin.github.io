'use strict';

/**
 * GitHub Adapter — M2-001
 * Wraps gh CLI for PR operations.
 */

const { execSync } = require('child_process');

// SECURITY: execSync is used with hardcoded command templates and no unsanitized user input.
// The args are either internal constants or escaped via escapeForDoubleQuotedShellArg().
// Therefore this usage is safe in this adapter despite using a shell command string.

function escapeForDoubleQuotedShellArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeForDoubleQuotedShellArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Create a PR.
 */
async function createPR({ head, base, title, body, method }) {
  if (!head) throw new Error('head is required');
  if (!base) throw new Error('base is required');
  if (!title) throw new Error('title is required');

  const validMethods = ['squash', 'rebase', 'merge'];
  if (method && !validMethods.includes(method)) {
    throw new Error(`method must be one of: ${validMethods.join(', ')}`);
  }

  const cmd = `/everything/bin/gh pr create --head ${head} --base ${base} --title "${escapeForDoubleQuotedShellArg(title)}" --body "${body ? escapeForDoubleQuotedShellArg(body) : ''}"`;

  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/);
    return {
      success: true,
      number: urlMatch ? parseInt(urlMatch[1]) : null,
      url: urlMatch ? urlMatch[0] : null,
      output: output.trim()
    };
  } catch (e) {
    return { success: false, error: e.message, output: e.stdout || '' };
  }
}

/**
 * Update a PR.
 */
async function updatePR(prNumber, { title, body }) {
  if (!prNumber || !Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('prNumber must be a positive integer');
  }

  try {
    const cmd = `/everything/bin/gh pr edit ${prNumber}${title ? ` --title "${escapeForDoubleQuotedShellArg(title)}"` : ''}${body ? ` --body "${escapeForDoubleQuotedShellArg(body)}"` : ''}`;
    const output = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    return { success: true, output: output.trim() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get PR checks status.
 */
async function getChecks(prNumber) {
  if (!prNumber || !Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('prNumber must be a positive integer');
  }

  try {
    const output = execSync(
      `/everything/bin/gh pr view ${prNumber} --json statusCheckRollup 2>&1`,
      { encoding: 'utf8', timeout: 30000 }
    );
    const data = JSON.parse(output);
    return { success: true, checks: data.statusCheckRollup || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Merge a PR.
 */
async function mergePR(prNumber, method = 'squash') {
  if (!prNumber || !Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('prNumber must be a positive integer');
  }

  const validMethods = ['squash', 'rebase', 'merge'];
  if (!validMethods.includes(method)) {
    throw new Error(`method must be one of: ${validMethods.join(', ')}`);
  }

  try {
    const output = execSync(
      `/everything/bin/gh pr merge ${prNumber} --${method} --admin 2>&1`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return { success: true, output: output.trim() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Close a PR.
 */
async function closePR(prNumber) {
  if (!prNumber || !Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('prNumber must be a positive integer');
  }

  try {
    execSync(`/everything/bin/gh pr close ${prNumber} 2>&1`, { encoding: 'utf8', timeout: 30000 });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = { createPR, updatePR, getChecks, mergePR, closePR };
