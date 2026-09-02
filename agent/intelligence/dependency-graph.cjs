'use strict';

function buildDependencyGraph(repoGraph, packageJson) {
  const nodes = (repoGraph.nodes || []).slice();
  const edges = (repoGraph.edges || []).filter(e => !e.type || e.type === 'imports' || e.type === 'depends' || e.type === 'belongs-to' || e.type === 'ci-covers').slice();
  const nodeIds = new Set(nodes.map(n => n.id));

  if (packageJson && typeof packageJson === 'object') {
    const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    for (const [pkg] of Object.entries(deps)) {
      const pid = `package:${pkg}`;
      if (!nodeIds.has(pid)) {
        nodes.push({ id: pid, type: 'package' });
        nodeIds.add(pid);
      }
    }
  }

  for (const e of repoGraph.edges || []) {
    if (e.type === 'task-owns') {
      if (!nodeIds.has(e.from)) { nodes.push({ id: e.from, type: 'task' }); nodeIds.add(e.from); }
    }
  }

  const meta = {
    totalPackages: nodes.filter(n => n.type === 'package').length,
    totalFiles: nodes.filter(n => n.type === 'file').length,
    builtAt: new Date().toISOString()
  };

  return { nodes, edges, meta };
}

function detectCycles(graph) {
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    if (!e.type || e.type === 'imports' || e.type === 'depends') adj.get(e.from).push(e.to);
  }

  const visited = new Set();
  const stack = new Set();
  const parent = new Map();
  let culpritEdge = null;
  const cycles = [];

  function dfs(u) {
    visited.add(u);
    stack.add(u);
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        parent.set(v, u);
        if (dfs(v)) return true;
      } else if (stack.has(v)) {
        culpritEdge = { from: u, to: v };
        const cyc = [v];
        let cur = u;
        while (cur !== v && cur !== undefined) {
          cyc.push(cur);
          cur = parent.get(cur);
        }
        cyc.push(v);
        cycles.push(cyc.reverse());
        return true;
      }
    }
    stack.delete(u);
    return false;
  }

  for (const n of graph.nodes) {
    if (!visited.has(n.id)) {
      parent.set(n.id, null);
      dfs(n.id);
      if (culpritEdge) break;
    }
  }

  return { hasCycle: cycles.length > 0, cycles, culpritEdge: culpritEdge || null };
}

function transitiveClosure(graph, start) {
  const adj = new Map();
  for (const e of graph.edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e.to);
  }
  const visited = new Set();
  const queue = [start];
  const result = new Set();
  visited.add(start);
  while (queue.length) {
    const cur = queue.shift();
    for (const nxt of adj.get(cur) || []) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        result.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return result;
}

function getDependents(graph, target) {
  const rev = new Map();
  for (const e of graph.edges) {
    if (!rev.has(e.to)) rev.set(e.to, []);
    rev.get(e.to).push(e.from);
  }
  const visited = new Set();
  const queue = [target];
  const result = [];
  visited.add(target);
  while (queue.length) {
    const cur = queue.shift();
    for (const dep of rev.get(cur) || []) {
      if (!visited.has(dep)) {
        visited.add(dep);
        result.push(dep);
        queue.push(dep);
      }
    }
  }
  return result;
}

function getDependencies(graph, source) {
  return Array.from(transitiveClosure(graph, source));
}

module.exports = { buildDependencyGraph, detectCycles, transitiveClosure, getDependents, getDependencies };
