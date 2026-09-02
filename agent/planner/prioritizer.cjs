'use strict';

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };
const RISK_ORDER = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };

function priorityRank(p) {
  if (p in PRIORITY_ORDER) return PRIORITY_ORDER[p];
  return 1;
}

function riskRank(r) {
  if (r in RISK_ORDER) return RISK_ORDER[r];
  return 1;
}

function computePriorityScore(task, impactMap) {
  const p = priorityRank(task.priority);
  const r = riskRank(task.risk);
  const impact = impactMap && task.id && impactMap[task.id] != null ? Number(impactMap[task.id]) : 0;
  return p * 100 + r * 10 - impact;
}

function prioritizeTasks(tasks, opts = {}) {
  if (!Array.isArray(tasks)) throw new Error('tasks must be array');
  const impactMap = opts.impactMap || opts.impact || {};
  const budget = opts.budget || {};
  const maxWorkers = typeof budget.maxWorkers === 'number' ? budget.maxWorkers : null;

  const scored = tasks.map((t, idx) => ({
    task: t,
    idx,
    pRank: priorityRank(t.priority),
    rRank: riskRank(t.risk),
    impact: impactMap[t.id] != null ? Number(impactMap[t.id]) : 0
  }));

  scored.sort((a, b) => {
    if (a.pRank !== b.pRank) return a.pRank - b.pRank;
    if (a.rRank !== b.rRank) return b.rRank - a.rRank;
    if (a.impact !== b.impact) return b.impact - a.impact;
    if (a.task.id < b.task.id) return -1;
    if (a.task.id > b.task.id) return 1;
    return a.idx - b.idx;
  });

  let ranked = scored.map(s => s.task);
  let truncated = false;
  if (maxWorkers != null && ranked.length > maxWorkers) {
    ranked = ranked.slice(0, maxWorkers);
    truncated = true;
  }

  return {
    ranked,
    truncated,
    budget: { maxWorkers, applied: maxWorkers != null },
    totalBeforeBudget: tasks.length,
    totalAfterBudget: ranked.length
  };
}

module.exports = { prioritizeTasks, computePriorityScore, PRIORITY_ORDER, RISK_ORDER };
