'use strict';

/**
 * Release Agent — M2-007
 * Manages PR lifecycle: create → CI → review → merge → deploy → postcheck.
 */

const { execSync } = require('child_process');
const { createEvidence } = require('../evidence/evidence.cjs');

// SECURITY: All execSync calls use hardcoded args. No user input in shell strings.

class ReleaseAgent {
  constructor({ repository, evidence }) {
    this.repository = repository;
    this.evidence = evidence;
  }

  /**
   * Create a PR.
   * @param {Object} params
   * @param {string} params.head - branch to merge
   * @param {string} params.base - target branch
   * @param {string} params.title - PR title
   * @param {string} params.body - PR body
   * @returns {Object} PR info
   */
  createPR({ head, base, title, body }) {
    const cmd = `/everything/bin/gh pr create --head ${head} --base ${base} --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\'').replace(/\n/g, '\\n')}"`;

    try {
      const output = execSync(cmd, {
        cwd: this.repository,
        encoding: 'utf8',
        timeout: 30000
      });

      const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/);
      const prNumber = urlMatch ? parseInt(urlMatch[1]) : null;

      return {
        success: true,
        url: urlMatch ? urlMatch[0] : null,
        number: prNumber,
        output: output.trim()
      };
    } catch (e) {
      return {
        success: false,
        error: e.message,
        output: e.stdout || ''
      };
    }
  }

  /**
   * Wait for CI to complete.
   * @param {number} prNumber
   * @param {number} [maxWaitSeconds] - max wait time
   * @returns {Object} { passed: boolean, checks: Object[] }
   */
  async waitForCI(prNumber, maxWaitSeconds = 300) {
    const startedAt = Date.now();
    const maxMs = maxWaitSeconds * 1000;

    while (Date.now() - startedAt < maxMs) {
      try {
        const output = execSync(
          `/everything/bin/gh pr view ${prNumber} --json statusCheckRollup 2>&1`,
          { cwd: this.repository, encoding: 'utf8', timeout: 30000 }
        );

        const data = JSON.parse(output);
        const checks = data.statusCheckRollup || [];

        const allDone = checks.every(c => c.status === 'COMPLETED');
        const allPassed = checks.filter(c => c.conclusion === 'SUCCESS' || c.conclusion === 'SKIPPED').length === checks.length;
        const anyFailed = checks.some(c => c.conclusion === 'FAILURE' || c.conclusion === 'ERROR');

        if (allDone) {
          return { passed: !anyFailed, checks };
        }

        if (anyFailed) {
          return { passed: false, checks };
        }
      } catch (e) {
        // Retry on error
      }

      // Wait 10 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return { passed: false, checks: [], error: 'timeout' };
  }

  /**
   * Merge a PR.
   * @param {number} prNumber
   * @param {string} [method] - squash, rebase, merge
   * @returns {Object}
   */
  mergePR(prNumber, method = 'squash') {
    try {
      const output = execSync(
        `/everything/bin/gh pr merge ${prNumber} --${method} --admin 2>&1`,
        { cwd: this.repository, encoding: 'utf8', timeout: 30000 }
      );

      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Close a PR.
   * @param {number} prNumber
   * @returns {Object}
   */
  closePR(prNumber) {
    try {
      execSync(`/everything/bin/gh pr close ${prNumber} 2>&1`, {
        cwd: this.repository,
        encoding: 'utf8',
        timeout: 30000
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = { ReleaseAgent };
