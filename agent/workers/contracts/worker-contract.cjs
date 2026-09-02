'use strict';

/**
 * Worker Contract — M1-010
 * Standardized interface for all agent workers.
 */

/**
 * @typedef {Object} WorkerContext
 * @property {Object} task — task from Beads graph
 * @property {Object} repository — repository state snapshot
 * @property {Object} policy — policy engine instance
 * @property {Object} evidence — evidence collector
 * @property {Object} constraints — execution constraints
 * @property {string} workspace — isolated worktree path
 */

/**
 * @typedef {Object} WorkerResult
 * @property {'success'|'failed'|'blocked'|'escalated'} status
 * @property {Object} changes
 * @property {string[]} changes.files
 * @property {string} changes.summary
 * @property {Object[]} verification
 * @property {Object[]} evidence
 * @property {string[]} risks
 * @property {'continue'|'retry'|'review'|'escalate'} next_action
 */

/**
 * Validate a WorkerResult object.
 * @param {WorkerResult} result
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateWorkerResult(result) {
  const errors = [];
  const validStatuses = ['success', 'failed', 'blocked', 'escalated'];
  const validActions = ['continue', 'retry', 'review', 'escalate'];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['result must be an object'] };
  }

  if (!validStatuses.includes(result.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  if (!Array.isArray(result.changes?.files)) {
    errors.push('changes.files must be an array');
  }

  if (typeof result.changes?.summary !== 'string') {
    errors.push('changes.summary must be a string');
  }

  if (!Array.isArray(result.verification)) {
    errors.push('verification must be an array');
  }

  if (!Array.isArray(result.evidence)) {
    errors.push('evidence must be an array');
  }

  if (!Array.isArray(result.risks)) {
    errors.push('risks must be an array');
  }

  if (!validActions.includes(result.next_action)) {
    errors.push(`next_action must be one of: ${validActions.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateWorkerResult };
