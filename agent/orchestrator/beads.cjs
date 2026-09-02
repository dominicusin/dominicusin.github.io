'use strict';

/**
 * Beads Adapter — M1-006
 * Loads and queries the Beads task graph.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load a Beads graph from file.
 * @param {string} beadsPath - path to beads.json
 * @returns {Object} graph with nodes array
 */
function loadGraph(beadsPath) {
  const content = fs.readFileSync(beadsPath, 'utf8');
  const graph = JSON.parse(content);

  if (!graph.nodes || !Array.isArray(graph.nodes)) {
    throw new Error('Invalid graph: missing nodes array');
  }

  return graph;
}

/**
 * Get all READY tasks.
 * A task is READY if status == 'pending' AND all deps are 'done'.
 * @param {Object} graph
 * @returns {Object[]} ready tasks
 */
function getReadyTasks(graph) {
  const doneIds = new Set(
    graph.nodes
      .filter(n => n.status === 'done')
      .map(n => n.id)
  );

  return graph.nodes.filter(n => {
    if (n.status !== 'pending') return false;
    if (!n.deps || n.deps.length === 0) return true;
    return n.deps.every(depId => doneIds.has(depId));
  });
}

/**
 * Get all BLOCKED tasks.
 * @param {Object} graph
 * @returns {Object[]}
 */
function getBlockedTasks(graph) {
  const doneIds = new Set(
    graph.nodes
      .filter(n => n.status === 'done')
      .map(n => n.id)
  );

  return graph.nodes.filter(n => {
    if (n.status !== 'pending') return false;
    if (!n.deps || n.deps.length === 0) return false;
    return n.deps.some(depId => !doneIds.has(depId));
  });
}

/**
 * Transition a task to a new status.
 * @param {Object} graph
 * @param {string} taskId
 * @param {string} newStatus
 * @returns {Object} updated graph
 */
function transitionTask(graph, taskId, newStatus) {
  const node = graph.nodes.find(n => n.id === taskId);
  if (!node) {
    throw new Error(`Task not found: ${taskId}`);
  }
  node.status = newStatus;
  return graph;
}

/**
 * Validate graph structure.
 * @param {Object} graph
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateGraph(graph) {
  const errors = [];

  if (!graph || typeof graph !== 'object') {
    return { valid: false, errors: ['graph must be an object'] };
  }

  if (!graph.nodes || !Array.isArray(graph.nodes)) {
    errors.push('graph.nodes must be an array');
    return { valid: false, errors };
  }

  const ids = new Set();
  for (const node of graph.nodes) {
    if (!node.id) {
      errors.push('node missing id');
      continue;
    }
    if (ids.has(node.id)) {
      errors.push(`duplicate node id: ${node.id}`);
    }
    ids.add(node.id);

    if (!node.status) {
      errors.push(`node ${node.id} missing status`);
    }
    if (!Array.isArray(node.deps)) {
      errors.push(`node ${node.id} missing deps array`);
    }
  }

  // Check for dangling deps
  for (const node of graph.nodes) {
    for (const dep of (node.deps || [])) {
      if (!ids.has(dep)) {
        errors.push(`node ${node.id} has dangling dep: ${dep}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { loadGraph, getReadyTasks, getBlockedTasks, transitionTask, validateGraph };
