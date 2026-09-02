'use strict';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildDepIndex(dependencies) {
  const forward = new Map();
  const reverse = new Map();
  for (const d of dependencies || []) {
    if (!forward.has(d.from)) forward.set(d.from, new Set());
    forward.get(d.from).add(d.to);
    if (!reverse.has(d.to)) reverse.set(d.to, new Set());
    reverse.get(d.to).add(d.from);
  }
  return { forward, reverse };
}

function collectAffected(initialIds, forward) {
  const affected = new Set(initialIds);
  const queue = [...initialIds];
  while (queue.length) {
    const cur = queue.shift();
    const next = forward.get(cur);
    if (!next) continue;
    for (const n of next) {
      if (!affected.has(n)) {
        affected.add(n);
        queue.push(n);
      }
    }
  }
  return affected;
}

function replan({ previousPlan, event, beads, memory, intelligence }) {
  if (!previousPlan || typeof previousPlan !== 'object') throw new Error('previousPlan required');
  if (!event || typeof event !== 'object') throw new Error('event required');
  const prevTasks = clone(previousPlan.tasks || []);
  const prevDeps = clone(previousPlan.dependencies || previousPlan.deps || previousPlan.edges || []);
  const normalizedDeps = prevDeps.map(d => ({ from: d.from || d.source, to: d.to || d.target })).filter(d => d.from && d.to);

  void beads;
  void memory;
  void intelligence;

  const doneIds = new Set(prevTasks.filter(t => t.status === 'done' || t.status === 'completed').map(t => t.id));
  const byId = new Map(prevTasks.map(t => [t.id, t]));

  let triggerIds = [];
  if (event.taskId) triggerIds = [event.taskId];
  else if (Array.isArray(event.taskIds)) triggerIds = event.taskIds.slice();
  else if (event.type === 'impact_change' && event.diff) triggerIds = (event.diff || []).map(d => d.taskId || d.id).filter(Boolean);
  else if (event.type === 'failure' && event.failedTaskId) triggerIds = [event.failedTaskId];

  if (triggerIds.length === 0 && event.type) {
    triggerIds = prevTasks.filter(t => t.status !== 'done').map(t => t.id).slice(0, 1);
  }

  const { forward } = buildDepIndex(normalizedDeps);
  const affected = triggerIds.length ? collectAffected(triggerIds, forward) : new Set();

  const preserved = [];
  const toRequeue = [];
  for (const t of prevTasks) {
    if (doneIds.has(t.id)) preserved.push(t.id);
    else if (affected.has(t.id)) toRequeue.push(t);
    else preserved.push(t.id);
  }

  const newTasks = prevTasks.map(t => {
    const c = clone(t);
    if (affected.has(t.id) && !doneIds.has(t.id)) {
      c.status = 'pending';
      c.replanned = true;
      c.replanReason = event.type || 'unknown';
    }
    return c;
  });

  let added = [];
  if (event.newTasks && Array.isArray(event.newTasks)) {
    for (const nt of event.newTasks) {
      if (!byId.has(nt.id)) {
        newTasks.push(clone(nt));
        added.push(nt.id);
      }
    }
  }

  if (event.type === 'impact_change' && event.impact && Array.isArray(event.impact.newTasks)) {
    for (const nt of event.impact.newTasks) {
      if (!byId.has(nt.id)) {
        newTasks.push(clone(nt));
        added.push(nt.id);
      }
    }
  }

  const plan = clone(previousPlan);
  plan.tasks = newTasks;
  plan.dependencies = normalizedDeps;
  plan.replannedAt = new Date().toISOString();
  plan.replanEvent = { type: event.type, taskId: event.taskId || null };

  const updated = toRequeue.map(t => t.id);
  const delta = {
    added,
    removed: [],
    updated,
    preserved: preserved.filter(id => !updated.includes(id)),
    affected: Array.from(affected)
  };

  const evidence = {
    type: 'replanner',
    replanned: true,
    timestamp: new Date().toISOString(),
    previousPlanHash: previousPlan.hash || null,
    delta,
    reason: event.type || 'unknown',
    triggerIds
  };

  return { plan, delta, evidence };
}

module.exports = { replan };
