'use strict';

const { decomposePlan } = require('./decomposition.cjs');
const { prioritizeTasks } = require('./prioritizer.cjs');
const { resolveDependencies } = require('./dependency-resolver.cjs');
const { replan } = require('./replanner.cjs');

const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'];
const DEFAULT_BUDGET = { maxWorkers: 3, maxTasks: 50 };
const WORKER_MAP = {
  content: ['content', 'knowledge-graph'],
  code: ['implementer', 'reviewer'],
  infra: ['architect', 'security'],
  test: ['reviewer']
};

function inferRisk(task, policy, architecture) {
  if (task.risk && RISK_LEVELS.includes(task.risk)) return task.risk;
  if (task.files && task.files.some(f => /secrets|\.env|credentials/i.test(f))) return 'R4';
  if (task.files && task.files.some(f => f.startsWith('.github/workflows'))) return 'R3';
  if (architecture && architecture.violations && architecture.violations.length) return 'R2';
  if (task.files && task.files.some(f => /\.(js|cjs|mjs)$/.test(f))) return 'R1';
  return 'R0';
}

function verificationForTask(task) {
  const r = task.risk || 'R1';
  const v = [];
  if (r === 'R0') v.push('npm run content-contract');
  if (['R1', 'R2', 'R3'].includes(r)) v.push('npm run lint', 'npm test');
  if (['R2', 'R3'].includes(r)) v.push('hugo --gc --minify');
  if (r === 'R3') v.push('node scripts/check-links.cjs');
  return [...new Set(v)];
}

function workersForTask(task) {
  const files = task.files || task.artifacts || [];
  if (files.some(f => f.includes('content/') || f.endsWith('.md'))) return ['content'];
  if (files.some(f => f.startsWith('.github/'))) return ['architect'];
  if (files.some(f => f.startsWith('agent/'))) return ['implementer'];
  if (files.some(f => f.startsWith('src/'))) return ['implementer'];
  return ['implementer'];
}

function escalationConditions(plan) {
  const conds = [];
  const maxRisk = plan.risk || 'R1';
  conds.push({ condition: 'risk == R4', action: 'human_approval', triggered: maxRisk === 'R4' });
  conds.push({ condition: 'risk >= R3', action: 'review_required', triggered: ['R3', 'R4'].includes(maxRisk) });
  conds.push({ condition: 'ci_state == red', action: 'replan', triggered: plan.ciState === 'red' });
  conds.push({ condition: 'budget_exceeded', action: 'escalate', triggered: (plan.tasks || []).length > (plan.budget?.maxTasks || Infinity) });
  conds.push({ condition: 'verification_failed', action: 'replan', triggered: false });
  return conds;
}

function createAdaptivePlan(opts = {}) {
  const beads = opts.beads || { nodes: [] };
  const repositoryGraph = opts.repositoryGraph || opts.graph || { nodes: [], edges: [] };
  const architecture = opts.architecture || null;
  const memory = opts.memory || null;
  const policy = opts.policy || null;
  const ciState = opts.ciState || opts.ci || { status: 'green' };
  const budget = { ...DEFAULT_BUDGET, ...(opts.budget || {}) };
  const initiative = opts.initiative || null;
  void repositoryGraph;
  void memory;
  void policy;

  let rawTasks = [];
  if (Array.isArray(beads.nodes) && beads.nodes.length) {
    rawTasks = beads.nodes.map(n => ({
      id: n.id,
      title: n.title || n.id,
      status: n.status || 'pending',
      deps: n.deps ? n.deps.slice() : [],
      files: n.artifacts ? n.artifacts.slice() : n.files ? n.files.slice() : [],
      artifacts: n.artifacts ? n.artifacts.slice() : [],
      risk: n.risk || inferRisk(n, policy, architecture),
      priority: n.priority || 'P1',
      kind: n.kind || 'task',
      acceptance: n.acceptance_criteria || n.acceptance || []
    }));
  } else if (initiative) {
    rawTasks = [{ id: initiative.id || 'INIT-001', title: initiative.description || initiative.title || 'initiative', status: 'pending', deps: [], files: [], artifacts: [], risk: 'R1', priority: 'P1', kind: 'task', acceptance: [] }];
  }

  for (const t of rawTasks) {
    if (!t.risk) t.risk = inferRisk(t, policy, architecture);
    if (!RISK_LEVELS.includes(t.risk)) t.risk = 'R1';
    if (!t.priority) t.priority = 'P1';
    if (!Array.isArray(t.files)) t.files = [];
    if (!Array.isArray(t.artifacts)) t.artifacts = t.files.slice();
    t.workers = workersForTask(t);
    t.verification = verificationForTask(t);
    t.acceptance = t.acceptance || [];
    t.budget = { maxWorkers: budget.maxWorkers };
  }

  const decomposed = decomposePlan(rawTasks, { maxSubtasks: 5 });
  const impactMap = opts.impactMap || (opts.intelligence && opts.intelligence.impact) || {};
  const prioritized = prioritizeTasks(decomposed, { budget, impactMap });

  let tasks = prioritized.ranked;
  const dependencies = [];
  for (const t of tasks) {
    for (const dep of (t.deps || [])) {
      if (tasks.some(x => x.id === dep)) dependencies.push({ from: dep, to: t.id });
    }
  }
  if (tasks.length > 1 && dependencies.length === 0 && rawTasks.length > 1) {
    for (let i = 1; i < tasks.length; i++) dependencies.push({ from: tasks[i - 1].id, to: tasks[i].id });
  }

  let resolved;
  try {
    resolved = resolveDependencies({ tasks, dependencies });
  } catch (e) {
    throw e;
  }

  const maxRisk = tasks.reduce((m, t) => Math.max(m, RISK_LEVELS.indexOf(t.risk)), 0);
  const overallRisk = RISK_LEVELS[maxRisk] || 'R1';
  const ciStatus = typeof ciState === 'string' ? ciState : ciState.status || 'green';

  const plan = {
    tasks,
    dependencies: resolved.dependencies,
    workers: [...new Set(tasks.flatMap(t => t.workers || []))],
    verification: [...new Set(tasks.flatMap(t => t.verification || []))],
    budget: { ...budget, estimatedTasks: tasks.length, truncated: prioritized.truncated },
    risk: overallRisk,
    escalationConditions: escalationConditions({ risk: overallRisk, ciState: ciStatus, tasks, budget }),
    stages: resolved.stages,
    order: resolved.order,
    ciState: ciStatus,
    architecture: architecture ? { valid: architecture.valid, violations: architecture.violations || [] } : null,
    acceptance: tasks.flatMap(t => t.acceptance || []),
    metadata: { totalTasks: tasks.length, totalEdges: resolved.dependencies.length, estimatedRisk: overallRisk, acyclic: true },
    hash: null
  };

  plan.escalation_conditions = plan.escalationConditions;

  return plan;
}

function validatePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['plan must be object'] };
  if (!Array.isArray(plan.tasks)) errors.push('tasks must be array');
  if (!Array.isArray(plan.dependencies) && !Array.isArray(plan.deps) && !Array.isArray(plan.edges)) errors.push('dependencies must be array');
  if (!plan.risk || !RISK_LEVELS.includes(plan.risk)) errors.push('risk must be R0..R4');
  if (!plan.budget || typeof plan.budget.maxWorkers !== 'number') errors.push('budget.maxWorkers required');
  if (!Array.isArray(plan.escalationConditions || plan.escalation_conditions)) errors.push('escalationConditions required');
  if (!Array.isArray(plan.workers)) errors.push('workers must be array');
  if (!Array.isArray(plan.verification)) errors.push('verification must be array');
  const deps = plan.dependencies || plan.deps || plan.edges || [];
  const ids = new Set((plan.tasks || []).map(t => t.id));
  for (const d of deps) {
    const f = d.from || d.source;
    const t = d.to || d.target;
    if (!ids.has(f)) errors.push(`dependency from unknown task: ${f}`);
    if (!ids.has(t)) errors.push(`dependency to unknown task: ${t}`);
  }
  try {
    resolveDependencies({ tasks: plan.tasks || [], dependencies: deps });
  } catch (e) {
    errors.push(e.message);
  }
  return { valid: errors.length === 0, errors };
}

class AdaptivePlanner {
  constructor(opts = {}) {
    this.opts = opts;
  }
  createPlan(input) {
    return createAdaptivePlan({ ...this.opts, ...input });
  }
  replan(input) {
    return replan(input);
  }
  validate(plan) {
    return validatePlan(plan);
  }
}

module.exports = { AdaptivePlanner, createAdaptivePlan, validatePlan, DEFAULT_BUDGET, WORKER_MAP, replan };
