'use strict';

/**
 * Self-Improving Factory — M3-005
 * Analyzes factory telemetry and creates improvement tasks.
 */

const fs = require('fs');
const path = require('path');

class SelfImprovingFactory {
  constructor({ repository, beads }) {
    this.repository = repository;
    this.beads = beads;
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      retriesUsed: 0,
      averageRetries: 0,
      escapedDefects: 0
    };
  }

  /**
   * Analyze factory performance and identify improvements.
   */
  analyze() {
    const improvements = [];

    // Analyze failure patterns
    const failureAnalysis = this._analyzeFailures();
    if (failureAnalysis.length > 0) {
      improvements.push(...failureAnalysis);
    }

    // Analyze retry patterns
    const retryAnalysis = this._analyzeRetries();
    if (retryAnalysis.length > 0) {
      improvements.push(...retryAnalysis);
    }

    // Analyze CI patterns
    const ciAnalysis = this._analyzeCI();
    if (ciAnalysis.length > 0) {
      improvements.push(...ciAnalysis);
    }

    // Analyze test patterns
    const testAnalysis = this._analyzeTests();
    if (testAnalysis.length > 0) {
      improvements.push(...testAnalysis);
    }

    return improvements;
  }

  _analyzeFailures() {
    const improvements = [];
    const { tasksCompleted, tasksFailed, retriesUsed } = this.metrics;

    if (tasksFailed > tasksCompleted * 0.2) {
      improvements.push({
        type: 'reliability',
        severity: 'high',
        description: `High failure rate: ${tasksFailed}/${tasksCompleted + tasksFailed}`,
        action: 'Review common failure patterns and add guards'
      });
    }

    if (retriesUsed > 0 && tasksFailed / retriesUsed > 0.5) {
      improvements.push({
        type: 'retry-efficiency',
        severity: 'medium',
        description: 'Retries often lead to failures',
        action: 'Improve initial implementation quality'
      });
    }

    return improvements;
  }

  _analyzeRetries() {
    const improvements = [];
    const { averageRetries } = this.metrics;

    if (averageRetries > 1.5) {
      improvements.push({
        type: 'retry-pattern',
        severity: 'medium',
        description: `High average retries: ${averageRetries.toFixed(2)}`,
        action: 'Investigate common failure causes'
      });
    }

    return improvements;
  }

  _analyzeCI() {
    const improvements = [];
    const ciFailures = this.metrics.ciFailures || 0;

    if (ciFailures > 5) {
      improvements.push({
        type: 'ci-stability',
        severity: 'high',
        description: `Frequent CI failures: ${ciFailures}`,
        action: 'Stabilize CI pipeline'
      });
    }

    return improvements;
  }

  _analyzeTests() {
    const improvements = [];
    const escapedDefects = this.metrics.escapedDefects || 0;

    if (escapedDefects > 0) {
      improvements.push({
        type: 'test-coverage',
        severity: 'medium',
        description: `Escaped defects: ${escapedDefects}`,
        action: 'Add regression tests'
      });
    }

    return improvements;
  }

  /**
   * Update metrics from run results.
   */
  updateMetrics(result) {
    if (result.status === 'success') {
      this.metrics.tasksCompleted++;
    } else {
      this.metrics.tasksFailed++;
    }

    if (result.retries) {
      this.metrics.retriesUsed += result.retries;
      this.metrics.averageRetries = this.metrics.retriesUsed / (this.metrics.tasksCompleted + this.metrics.tasksFailed);
    }
  }

  /**
   * Generate improvement tasks for Beads.
   */
  generateTasks(improvements) {
    return improvements.map((imp, i) => ({
      id: `IMPROVE-${Date.now()}-${i}`,
      kind: 'task',
      title: `[Auto] ${imp.description}`,
      status: 'pending',
      deps: [],
      artifacts: [],
      risk: 'R1',
      description: `Auto-generated: ${imp.action}`,
      severity: imp.severity,
      type: imp.type,
      pr: null
    }));
  }
}

module.exports = { SelfImprovingFactory };
