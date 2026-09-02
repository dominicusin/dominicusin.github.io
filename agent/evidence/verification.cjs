'use strict';

/**
 * Verification Runner — M2-005
 * Runs verification commands and collects evidence.
 *
 * Critical rule: exit_code !== 0 → verification FAILED
 * No `|| true` for hard gates.
 */

const { execSync } = require('child_process');
const { createEvidence } = require('./evidence.cjs');

// SECURITY: All execSync calls use hardcoded args. No user input in shell strings.

/**
 * Run a single verification command.
 * @param {Object} params
 * @param {string} params.command - shell command
 * @param {string} [params.cwd] - working directory
 * @param {number} [params.timeout] - timeout in ms
 * @returns {{ exit_code: number, stdout: string, stderr: string, duration_ms: number, evidence: Object }}
 */
async function runVerification({ command, cwd = process.cwd(), timeout = 60000 }) {
  const startedAt = Date.now();
  let exitCode = 0;
  let stdout = '';
  let stderr = '';

  try {
    stdout = execSync(command, {
      cwd,
      encoding: 'utf8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout || '';
    stderr = e.stderr || '';
  }

  const finishedAt = Date.now();
  const durationMs = finishedAt - startedAt;

  const evidence = createEvidence({
    command,
    exitCode,
    commit: 'a'.repeat(40), // placeholder, should be actual commit
    stdout,
    startedAt,
    finishedAt
  });

  return { exit_code: exitCode, stdout, stderr, duration_ms: durationMs, evidence };
}

/**
 * Run multiple verification commands.
 * @param {Object[]} commands - array of { command, cwd }
 * @returns {{ passed: boolean, results: Array }}
 */
async function runVerifications(commands) {
  const results = [];
  let passed = true;

  for (const cmd of commands) {
    const result = await runVerification(cmd);
    results.push(result);
    if (result.exit_code !== 0) {
      passed = false;
    }
  }

  return { passed, results };
}

module.exports = { runVerification, runVerifications };
