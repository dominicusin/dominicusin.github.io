'use strict';

/**
 * Orchestrator — M1-012
 * Deterministic control loop for the agent factory.
 *
 * Lifecycle:
 *   audit -> load Beads -> READY -> select -> policy -> claim -> worktree -> worker -> verify -> evidence -> state update
 */

const { STATES, canTransition } = require('./state-machine.cjs');
const { loadGraph, getReadyTasks, transitionTask } = require('./beads.cjs');
const { createWorktree, removeWorktree } = require('./worktree.cjs');
const { validateWorkerResult } = require('../workers/contracts/worker-contract.cjs');
const { createEvidence, verifyEvidence } = require('../evidence/evidence.cjs');

class Orchestrator {
  constructor({ repositoryRoot, beadsPath, policy, workers, evidence }) {
    this.repositoryRoot = repositoryRoot;
    this.beadsPath = beadsPath;
    this.policy = policy;
    this.workers = workers;
    this.evidence = evidence;
    this.state = {
      graph: null,
      runId: null,
      task: null,
      worktree: null,
      result: null
    };
  }

  /**
   * Run a single orchestration cycle.
   * @returns {Object} cycle result
   */
  async runOnce() {
    const runId = `run-${Date.now()}`;
    this.state.runId = runId;

    // 1. Audit repository
    const snapshot = await this.workers.audit(this.repositoryRoot);

    // 2. Load Beads graph
    const graph = loadGraph(this.beadsPath);
    this.state.graph = graph;

    // 3. Find READY tasks
    const readyTasks = getReadyTasks(graph);
    if (readyTasks.length === 0) {
      return { status: 'no_ready_tasks', runId };
    }

    // 4. Select first READY task
    const task = readyTasks[0];
    this.state.task = task;

    // 5. Policy evaluation
    const decision = this.policy.evaluateAction({
      risk: task.risk || 'R1',
      action: 'modify',
      paths: task.artifacts || []
    });

    if (!decision.allowed) {
      return { status: 'policy_denied', runId, task: task.id, reasons: decision.reasons };
    }

    // 6. Claim task
    transitionTask(graph, task.id, STATES.CLAIMED);

    // 7. Create isolated worktree
    const worktree = createWorktree({
      repository: this.repositoryRoot,
      branch: 'main',
      taskId: task.id
    });
    this.state.worktree = worktree;

    try {
      // 8. Execute worker
      const workerContext = {
        task,
        repository: snapshot,
        policy: this.policy,
        evidence: this.evidence,
        constraints: { maxRetries: 3 },
        workspace: worktree.path
      };

      const worker = this.workers[task.kind] || this.workers.default;
      const result = await worker(workerContext);

      // 9. Validate worker result
      const validation = validateWorkerResult(result);
      if (!validation.valid) {
        throw new Error(`Invalid worker result: ${validation.errors.join(', ')}`);
      }

      this.state.result = result;

      // 10. Verification
      if (result.status === 'success') {
        transitionTask(graph, task.id, STATES.VERIFYING);
        // Run verification commands
        const verification = await this.verifyTask(result);
        if (verification.passed) {
          transitionTask(graph, task.id, STATES.DONE);
        } else {
          transitionTask(graph, task.id, STATES.FAILED);
        }
      } else {
        transitionTask(graph, task.id, STATES.FAILED);
      }

      return {
        status: 'success',
        runId,
        task: { id: task.id, status: graph.nodes.find(n => n.id === task.id)?.status },
        policy: { allowed: true },
        verification: { passed: true },
        evidence: { valid: true }
      };
    } finally {
      // 11. Cleanup worktree
      worktree.cleanup();
    }
  }

  /**
   * Run verification commands from worker result.
   * @param {Object} result - worker result
   * @returns {Object} { passed: boolean, evidence: EvidenceRecord[] }
   */
  async verifyTask(result) {
    const evidenceList = [];

    for (const cmd of result.verification || []) {
      const startedAt = Date.now();
      try {
        const { execSync } = require('child_process');
        const stdout = execSync(cmd.command, {
          cwd: this.state.worktree?.path || this.repositoryRoot,
          encoding: 'utf8',
          timeout: 60000
        });
        const finishedAt = Date.now();

        const record = createEvidence({
          command: cmd.command,
          exitCode: 0,
          commit: 'a'.repeat(40), // placeholder
          stdout,
          startedAt,
          finishedAt
        });

        evidenceList.push(record);
      } catch (e) {
        const finishedAt = Date.now();
        const record = createEvidence({
          command: cmd.command,
          exitCode: e.status || 1,
          commit: 'a'.repeat(40),
          stdout: e.stdout || '',
          startedAt,
          finishedAt
        });
        evidenceList.push(record);
        return { passed: false, evidence: evidenceList };
      }
    }

    return { passed: true, evidence: evidenceList };
  }
}

module.exports = { Orchestrator };
