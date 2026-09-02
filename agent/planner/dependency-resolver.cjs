'use strict';

function buildAdj(tasks, dependencies) {
  const ids = new Set(tasks.map(t => t.id));
  const adj = new Map();
  const indeg = new Map();
  for (const t of tasks) {
    adj.set(t.id, []);
    indeg.set(t.id, 0);
  }
  for (const d of dependencies || []) {
    if (!ids.has(d.from) || !ids.has(d.to)) continue;
    adj.get(d.from).push(d.to);
    indeg.set(d.to, (indeg.get(d.to) || 0) + 1);
  }
  return { adj, indeg, ids };
}

function detectCycle(tasks, dependencies) {
  const { adj } = buildAdj(tasks, dependencies);
  const visited = new Set();
  const stack = new Set();
  const path = [];

  function dfs(node) {
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const nb of adj.get(node) || []) {
      if (!visited.has(nb)) {
        const res = dfs(nb);
        if (res) return res;
      } else if (stack.has(nb)) {
        const idx = path.indexOf(nb);
        const cycle = path.slice(idx).concat([nb]);
        return cycle;
      }
    }
    stack.delete(node);
    path.pop();
    return null;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      const c = dfs(t.id);
      if (c) return c;
    }
  }
  return null;
}

function topologicalSort(tasks, dependencies) {
  const { adj, indeg } = buildAdj(tasks, dependencies);
  const cycle = detectCycle(tasks, dependencies);
  if (cycle) {
    const err = new Error(`Cycle detected: ${cycle.join(' -> ')}`);
    err.cycle = cycle;
    throw err;
  }
  const idToTask = new Map(tasks.map(t => [t.id, t]));
  const queue = [];
  for (const [id, deg] of indeg) if (deg === 0) queue.push(id);
  queue.sort();
  const order = [];
  while (queue.length) {
    const cur = queue.shift();
    order.push(idToTask.get(cur));
    for (const nb of (adj.get(cur) || []).slice().sort()) {
      const nd = indeg.get(nb) - 1;
      indeg.set(nb, nd);
      if (nd === 0) queue.push(nb);
    }
    queue.sort();
  }
  if (order.length !== tasks.length) {
    const err = new Error('Cycle detected: unresolved dependencies');
    err.cycle = [];
    throw err;
  }
  return order;
}

function buildStages(tasks, dependencies) {
  const order = topologicalSort(tasks, dependencies);
  const idToTask = new Map(tasks.map(t => [t.id, t]));
  const depMap = new Map();
  for (const t of tasks) depMap.set(t.id, []);
  for (const d of dependencies || []) {
    if (depMap.has(d.to)) depMap.get(d.to).push(d.from);
  }
  const levels = new Map();
  for (const t of order) {
    const deps = depMap.get(t.id) || [];
    let lvl = 0;
    for (const dep of deps) lvl = Math.max(lvl, (levels.get(dep) || 0) + 1);
    levels.set(t.id, lvl);
  }
  const maxLevel = Math.max(0, ...Array.from(levels.values()));
  const stages = [];
  for (let l = 0; l <= maxLevel; l++) {
    const stageTasks = order.filter(t => levels.get(t.id) === l);
    if (stageTasks.length) stages.push({ level: l, tasks: stageTasks.map(t => t.id), parallel: stageTasks.length > 1, taskObjs: stageTasks });
  }
  return { order, stages };
}

function resolveDependencies(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('plan required');
  const tasks = plan.tasks || [];
  const dependencies = plan.dependencies || plan.deps || plan.edges || [];
  const normalized = dependencies.map(d => ({ from: d.from || d.source, to: d.to || d.target })).filter(d => d.from && d.to);
  const { order, stages } = buildStages(tasks, normalized);
  return {
    order: order.map(t => t.id),
    orderedTasks: order,
    stages,
    dependencies: normalized,
    acyclic: true
  };
}

module.exports = { topologicalSort, detectCycle, buildStages, resolveDependencies };
