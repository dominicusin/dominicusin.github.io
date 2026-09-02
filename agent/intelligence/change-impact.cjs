'use strict';
const path = require('path');

function inferModule(filePath) {
  const parts = filePath.split('/');
  if (parts[0] === 'agent') {
    if (parts.length === 2 && parts[1].includes('.')) return 'agent';
    if (parts.length >= 2) return `agent/${parts[1]}`;
  }
  if (parts[0] === 'src') {
    if (parts.length === 2 && parts[1].includes('.')) return 'src';
    if (parts.length >= 2) return `src/${parts[1]}`;
  }
  if (parts[0] === 'contracts') return 'contracts/dao';
  if (parts[0] === 'content') {
    if (parts.length === 2 && parts[1].includes('.')) return 'content';
    if (parts.length >= 2) return `content/${parts[1]}`;
  }
  if (parts[0] === 'layouts') return 'layouts';
  if (parts[0] === 'scripts') return 'scripts';
  if (parts[0] === 'static') return 'static';
  if (parts[0] === 'themes') return 'themes/blowfish';
  if (parts[0] === 'config') return 'config';
  if (parts[0] === '.github') return '.github/workflows';
  return parts[0] || 'root';
}

function findTestsForFile(filePath, allFiles) {
  const base = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const candidates = [
    `${dir}/${base}.test.cjs`,
    `${dir}/${base}.test.js`,
    `${dir}/${base}.spec.js`,
    `tests/${base}.test.js`,
    `agent/tests/${base}.test.cjs`,
    `src/${base}.test.js`
  ];
  const found = [];
  for (const c of candidates) {
    if (allFiles.includes(c)) found.push(c);
  }
  for (const f of allFiles) {
    if (f.includes('.test.') || f.includes('.spec.')) {
      if (f.includes(base) || (dir !== '.' && f.includes(dir.split('/').pop()))) {
        if (!found.includes(f)) found.push(f);
      }
    }
  }
  return [...new Set(found)];
}

function moduleToWorkers(mod) {
  const map = {
    'agent/memory': ['memory', 'implementer', 'tester'],
    'agent/intelligence': ['implementer', 'tester', 'reviewer'],
    'agent/planner': ['planner', 'architect', 'reviewer'],
    'agent/supervisor': ['supervisor', 'reviewer'],
    'agent/observability': ['observability', 'reviewer'],
    'agent/policy': ['security', 'reviewer'],
    'agent/learning': ['researcher', 'implementer'],
    'agent/verification': ['tester', 'reviewer'],
    'agent/healing': ['diagnostician', 'reviewer'],
    'agent/factory': ['release', 'reviewer'],
    'contracts/dao': ['contracts', 'security', 'tester'],
    'src': ['frontend', 'performance', 'a11y', 'tester'],
    'src/services': ['performance', 'tester'],
    'src/workers': ['implementer', 'tester'],
    'layouts': ['frontend', 'a11y', 'performance'],
    'scripts': ['quality', 'tester'],
    'content': ['content', 'reviewer'],
    'config': ['architect', 'reviewer'],
    '.github/workflows': ['release', 'security', 'reviewer'],
    'static': ['performance', 'a11y'],
    'themes/blowfish': ['frontend', 'a11y']
  };
  if (map[mod]) return map[mod];
  if (mod.startsWith('agent/')) return ['implementer', 'tester', 'reviewer'];
  if (mod.startsWith('src/')) return ['frontend', 'tester'];
  if (mod.startsWith('content/')) return ['content', 'reviewer'];
  return ['implementer', 'tester'];
}

function computeRiskScore({ affectedPaths, affectedModules, blastRadius, sensitive }) {
  if (affectedPaths.some(p => p.includes('agent/policy') || p.includes('secrets') || p.includes('.env'))) return 'R4';
  let score = 0;
  const isContracts = affectedPaths.some(p => p.includes('contracts') || p.endsWith('.sol'));
  const isWorkflow = affectedPaths.some(p => p.includes('.github/workflows') || p.includes('deploy') || p.includes('security.yml'));
  if (isContracts) score += 4;
  if (isWorkflow) score += 4;
  if (affectedModules.length >= 5) score += 2;
  else if (affectedModules.length >= 3) score += 1;
  if (blastRadius >= 10) score += 2;
  else if (blastRadius >= 5) score += 1;
  if (sensitive) score += 2;
  if (affectedPaths.length >= 10) score += 1;
  if (isContracts && score < 4) score = 4;
  if (isWorkflow && score < 4) score = 4;
  if (score >= 6) return 'R3';
  if (score >= 4) return 'R2';
  if (score >= 2) return 'R1';
  return 'R0';
}

function buildVerificationPlan({ affectedModules, affectedTests, riskScore }) {
  const plan = [];
  plan.push('npm run lint');
  if (affectedTests.length > 0) plan.push('npm test');
  else plan.push('npm run test:coverage');
  if (affectedModules.some(m => m.startsWith('src') || m.startsWith('layouts') || m === 'static')) {
    plan.push('npm run build');
  }
  if (affectedModules.includes('contracts/dao') || affectedModules.some(m => m.includes('contracts'))) {
    plan.push('npx hardhat test');
  }
  if (riskScore === 'R3' || riskScore === 'R4') {
    plan.push('npm run build && npm test && npx hardhat test');
  }
  if (affectedModules.includes('.github/workflows')) plan.push('npm run lint && npm test');
  return [...new Set(plan)];
}

function analyzeChangeImpact({ diff, repoGraph, depGraph, ownership, beads }) {
  if (!Array.isArray(diff)) diff = diff ? [diff] : [];
  const allFiles = (repoGraph.nodes || []).filter(n => n.type === 'file').map(n => n.id);
  const edgeMap = new Map();
  for (const e of (depGraph.edges || [])) {
    if (!edgeMap.has(e.from)) edgeMap.set(e.from, []);
    edgeMap.get(e.from).push(e.to);
  }
  const revMap = new Map();
  for (const e of (depGraph.edges || [])) {
    if (e.type !== 'imports' && e.type !== 'depends') continue;
    if (!revMap.has(e.to)) revMap.set(e.to, []);
    revMap.get(e.to).push(e.from);
  }

  const affectedSet = new Set(diff);
  const queue = [...diff];
  const visited = new Set(diff);
  while (queue.length) {
    const cur = queue.shift();
    const dependents = revMap.get(cur) || [];
    for (const d of dependents) {
      if (!visited.has(d)) {
        visited.add(d);
        affectedSet.add(d);
        queue.push(d);
      }
    }
    const deps = edgeMap.get(cur) || [];
    for (const dep of deps) {
      if (!affectedSet.has(dep) && allFiles.includes(dep)) {
        affectedSet.add(dep);
      }
    }
  }

  for (const d of diff) {
    const mod = inferModule(d);
    for (const f of allFiles) {
      if (inferModule(f) === mod && !affectedSet.has(f)) {
        const peerEdges = (depGraph.edges || []).some(e => (e.from === d && e.to === f) || (e.from === f && e.to === d));
        if (peerEdges) affectedSet.add(f);
      }
    }
  }

  const affectedPaths = [...affectedSet].sort();
  const affectedModules = [...new Set(affectedPaths.map(inferModule))].sort();

  const affectedTestsSet = new Set();
  for (const p of affectedPaths) {
    const tests = findTestsForFile(p, allFiles);
    for (const t of tests) affectedTestsSet.add(t);
  }
  for (const p of diff) {
    const closureTests = (depGraph.edges || [])
      .filter(e => e.from === p && e.to.includes('test'))
      .map(e => e.to);
    for (const t of closureTests) affectedTestsSet.add(t);
  }
  if (affectedTestsSet.size === 0) {
    for (const m of affectedModules) {
      for (const f of allFiles) {
        if ((f.includes('.test.') || f.includes('.spec.')) && inferModule(f) === m) affectedTestsSet.add(f);
      }
    }
  }
  const affectedTests = [...affectedTestsSet].sort();
  const blastRadius = affectedPaths.length;

  const sensitive = affectedPaths.some(p => p.includes('policy') || p.includes('security') || p.includes('deploy'));
  const riskScore = computeRiskScore({ affectedPaths, affectedModules, blastRadius, sensitive });

  const workerSet = new Set();
  for (const mod of affectedModules) {
    const ws = moduleToWorkers(mod);
    for (const w of ws) workerSet.add(w);
  }
  if (riskScore === 'R3' || riskScore === 'R4') workerSet.add('security');
  if (affectedTests.length > 3) workerSet.add('tester');
  if (blastRadius > 5) workerSet.add('reviewer');
  const requiredWorkers = [...workerSet].sort();

  const verificationPlan = buildVerificationPlan({ affectedModules, affectedTests, riskScore });

  const affectedTasks = [];
  if (beads && Array.isArray(beads.nodes)) {
    for (const node of beads.nodes) {
      if (!node.artifacts) continue;
      for (const art of node.artifacts) {
        if (affectedPaths.includes(art) || diff.includes(art)) {
          affectedTasks.push(node.id);
          break;
        }
      }
    }
  }

  return {
    affected_paths: affectedPaths,
    affected_modules: affectedModules,
    affected_tests: affectedTests,
    risk_score: riskScore,
    required_workers: requiredWorkers,
    verification_plan: verificationPlan,
    blastRadius,
    affected_tasks: [...new Set(affectedTasks)].sort(),
    evidence: {
      diff,
      blastRadius,
      moduleCount: affectedModules.length,
      testCount: affectedTests.length,
      riskFactors: { sensitive, blastRadius, moduleCount: affectedModules.length }
    }
  };
}

module.exports = { analyzeChangeImpact, inferModule, moduleToWorkers, computeRiskScore };
