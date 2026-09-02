'use strict';

/**
 * Evidence Contract — M1-001
 * Machine-readable proof of command execution.
 *
 * Truth Policy: every factual claim requires evidence.
 * { command, exit_code, commit, timestamp, stdout_hash, duration_ms }
 */

const crypto = require('crypto');

/**
 * Create an EvidenceRecord from command execution data.
 * @param {Object} params
 * @param {string} params.command — the shell command that was run
 * @param {number} params.exitCode — process exit code (0 = success)
 * @param {string} params.commit — git SHA at time of execution
 * @param {string} params.stdout — captured stdout
 * @param {number} params.startedAt — epoch ms
 * @param {number} params.finishedAt — epoch ms
 * @param {string} [params.outputPath] — optional path to saved output
 * @returns {EvidenceRecord}
 */
function createEvidence({ command, exitCode, commit, stdout, startedAt, finishedAt, outputPath }) {
  if (typeof command !== 'string' || command.length === 0) {
    throw new Error('Evidence: command must be a non-empty string');
  }
  if (typeof exitCode !== 'number') {
    throw new Error('Evidence: exitCode must be a number');
  }
  if (typeof commit !== 'string' || commit.length !== 40) {
    throw new Error('Evidence: commit must be a 40-char SHA');
  }
  if (typeof stdout !== 'string') {
    throw new Error('Evidence: stdout must be a string');
  }

  const stdoutHash = crypto.createHash('sha256').update(stdout).digest('hex');
  const durationMs = finishedAt - startedAt;

  return {
    command,
    exit_code: exitCode,
    commit,
    timestamp: new Date(startedAt).toISOString(),
    stdout_hash: stdoutHash,
    duration_ms: durationMs,
    output_path: outputPath
  };
}

/**
 * Validate an existing EvidenceRecord.
 * @param {EvidenceRecord} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
function verifyEvidence(record) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['record is not an object'] };
  }

  if (typeof record.command !== 'string' || record.command.length === 0) {
    errors.push('command must be a non-empty string');
  }

  if (typeof record.exit_code !== 'number') {
    errors.push('exit_code must be a number');
  }

  if (typeof record.commit !== 'string' || record.commit.length !== 40) {
    errors.push('commit must be a 40-char SHA');
  }

  if (typeof record.timestamp !== 'string') {
    errors.push('timestamp must be an ISO string');
  } else {
    const d = new Date(record.timestamp);
    if (isNaN(d.getTime())) {
      errors.push('timestamp must be a valid date');
    }
  }

  if (typeof record.stdout_hash !== 'string' || record.stdout_hash.length !== 64) {
    errors.push('stdout_hash must be a 64-char hex string');
  }

  if (typeof record.duration_ms !== 'number' || record.duration_ms < 0) {
    errors.push('duration_ms must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { createEvidence, verifyEvidence };
