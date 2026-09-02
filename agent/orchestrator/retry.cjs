'use strict';

/**
 * Retry Engine — M2-004
 * Bounded retry with failure signature tracking.
 *
 * Contract:
 *   retry({ attempt, maxRetries, failureSignature }) -> RetryDecision
 *
 * Rules:
 *   attempt < 3 AND signature changed -> RETRY
 *   same signature × 3 -> ESCALATE
 */

const { STATES } = require('./state-machine.cjs');

class RetryEngine {
  constructor(maxRetries = 3) {
    this.maxRetries = maxRetries;
    this.failureHistory = new Map(); // taskId -> FailureSignature[]
  }

  /**
   * Decide whether to retry or escalate.
   * @param {Object} params
   * @param {number} params.attempt - current attempt number (1-based)
   * @param {string} params.taskId - task ID
   * @param {Object} params.failureSignature - { type, command, exit_code, normalized_error_hash }
   * @returns {{ action: 'RETRY'|'ESCALATE', reason: string, attempt: number }}
   */
  decide({ attempt, taskId, failureSignature }) {
    if (attempt > this.maxRetries) {
      return {
        action: 'ESCALATE',
        reason: `Max retries (${this.maxRetries}) exceeded`,
        attempt
      };
    }

    const history = this.failureHistory.get(taskId) || [];
    history.push(failureSignature);
    this.failureHistory.set(taskId, history);

    // Check if same signature repeated
    if (history.length >= 2) {
      const last = history[history.length - 1];
      const prev = history[history.length - 2];

      if (this._signaturesMatch(last, prev)) {
        const sameCount = history.filter(s => this._signaturesMatch(s, last)).length;
        if (sameCount >= 2) {
          return {
            action: 'ESCALATE',
            reason: `Same failure signature repeated ${sameCount} times`,
            attempt
          };
        }
      }
    }

    return {
      action: 'RETRY',
      reason: `Attempt ${attempt}/${this.maxRetries}, signature changed`,
      attempt: attempt + 1
    };
  }

  /**
   * Check if two failure signatures match.
   */
  _signaturesMatch(a, b) {
    if (!a || !b) return false;
    return a.type === b.type &&
           a.command === b.command &&
           a.exit_code === b.exit_code &&
           a.normalized_error_hash === b.normalized_error_hash;
  }

  /**
   * Create a failure signature from an error.
   * @param {Object} error
   * @returns {Object}
   */
  static createSignature(error) {
    const crypto = require('crypto');
    const errorOutput = (error.stderr || error.stdout || error.message || '').trim();
    const normalized = errorOutput
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, 'N')
      .substring(0, 200);

    return {
      type: error.type || 'UNKNOWN',
      command: error.command || 'unknown',
      exit_code: error.exitCode || error.status || 1,
      normalized_error_hash: crypto.createHash('sha256').update(normalized).digest('hex')
    };
  }

  /**
   * Clear history for a task.
   * @param {string} taskId
   */
  clearHistory(taskId) {
    this.failureHistory.delete(taskId);
  }
}

module.exports = { RetryEngine };
