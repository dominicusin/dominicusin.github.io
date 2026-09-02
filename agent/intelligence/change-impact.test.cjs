'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { analyzeChangeImpact } = require('./change-impact.cjs');

function makeGraphs() {
  const repoGraph = {
    nodes: [
      { id: 'src/a.js', type: 'file', module: 'src' },
      { id: 'src/b.js', type: 'file', module: 'src' },
      { id: 'agent/memory/memory.cjs', type: 'file', module: 'agent/memory' },
      { id: 'contracts/dao/GovernanceToken.sol', type: 'file', module: 'contracts/dao' },
      { id: 'src/a.test.js', type: 'file', module: 'src' },
      { id: 'agent/memory/memory.test.cjs', type: 'file', module: 'agent/memory' },
      { id: 'src', type: 'module' },
      { id: 'agent/memory', type: 'module' },
      { id: 'contracts/dao', type: 'module' }
    ],
    edges: [
      { from: 'src/a.js', to: 'src/b.js', type: 'imports' },
      { from: 'T1', to: 'src/a.js', type: 'task-owns' }
    ]
  };
  const depGraph = {
    nodes: repoGraph.nodes,
    edges: [
      { from: 'src/a.js', to: 'src/b.js', type: 'imports' }
    ],
    meta: {}
  };
  const ownership = {
    'src/a.js': { team: '@frontend', capability: 'frontend', confidence: 'high', source: 'CODEOWNERS' },
    'src/b.js': { team: '@frontend', capability: 'frontend', confidence: 'high', source: 'CODEOWNERS' },
    'agent/memory/memory.cjs': { team: '@agent', capability: 'agent', confidence: 'high', source: 'CODEOWNERS' },
    'contracts/dao/GovernanceToken.sol': { team: '@contracts', capability: 'contracts', confidence: 'high', source: 'CODEOWNERS' }
  };
  const beads = { nodes: [{ id: 'T1', artifacts: ['src/a.js'] }, { id: 'T2', artifacts: ['agent/memory/memory.cjs'] }] };
  return { repoGraph, depGraph, ownership, beads };
}

test('change-impact returns affected_paths, modules, tests, risk_score, workers, verification_plan', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  const r = analyzeChangeImpact({ diff: ['src/a.js'], repoGraph, depGraph, ownership, beads });
  assert.ok(Array.isArray(r.affected_paths));
  assert.ok(Array.isArray(r.affected_modules));
  assert.ok(Array.isArray(r.affected_tests));
  assert.ok(typeof r.risk_score === 'string' && /^R[0-4]$/.test(r.risk_score));
  assert.ok(Array.isArray(r.required_workers));
  assert.ok(Array.isArray(r.verification_plan));
  assert.ok(r.affected_paths.includes('src/a.js'));
  assert.ok(r.affected_modules.includes('src'));
});

test('affected_tests derived from actual graph not static', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  const r = analyzeChangeImpact({ diff: ['src/a.js'], repoGraph, depGraph, ownership, beads });
  assert.ok(r.affected_tests.some(t => t.includes('a.test')));
  const r2 = analyzeChangeImpact({ diff: ['contracts/dao/GovernanceToken.sol'], repoGraph, depGraph, ownership, beads });
  assert.ok(!r2.affected_tests.includes('src/a.test.js'));
});

test('risk_score computed from blastRadius and file sensitivity', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  const low = analyzeChangeImpact({ diff: ['src/a.js'], repoGraph, depGraph, ownership, beads });
  assert.ok(['R0', 'R1', 'R2'].includes(low.risk_score));
  const high = analyzeChangeImpact({ diff: ['contracts/dao/GovernanceToken.sol'], repoGraph, depGraph, ownership, beads });
  assert.ok(['R2', 'R3', 'R4'].includes(high.risk_score));
  assert.ok(high.risk_score >= low.risk_score);
});

test('required_workers not statically picked - varies with affected modules', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  const rSrc = analyzeChangeImpact({ diff: ['src/a.js'], repoGraph, depGraph, ownership, beads });
  const rContracts = analyzeChangeImpact({ diff: ['contracts/dao/GovernanceToken.sol'], repoGraph, depGraph, ownership, beads });
  const rMemory = analyzeChangeImpact({ diff: ['agent/memory/memory.cjs'], repoGraph, depGraph, ownership, beads });
  assert.notDeepStrictEqual(rSrc.required_workers.sort(), rContracts.required_workers.sort(), 'workers differ by module');
  assert.ok(rContracts.required_workers.includes('security') || rContracts.required_workers.includes('contracts'));
  assert.ok(rMemory.required_workers.length > 0);
  const rSrc2 = analyzeChangeImpact({ diff: ['src/b.js'], repoGraph, depGraph, ownership, beads });
  assert.deepStrictEqual(rSrc.required_workers.sort(), rSrc2.required_workers.sort(), 'same module same workers');
});

test('verification_plan from CI coverage', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  const r = analyzeChangeImpact({ diff: ['src/a.js'], repoGraph, depGraph, ownership, beads });
  assert.ok(r.verification_plan.length > 0);
  assert.ok(r.verification_plan.some(c => c.includes('lint') || c.includes('test') || c.includes('hugo')));
});

test('uses dependency graph to expand blastRadius', () => {
  const { repoGraph, depGraph, ownership, beads } = makeGraphs();
  depGraph.edges.push({ from: 'src/b.js', to: 'agent/memory/memory.cjs', type: 'imports' });
  const r = analyzeChangeImpact({ diff: ['agent/memory/memory.cjs'], repoGraph, depGraph, ownership, beads });
  assert.ok(r.affected_paths.includes('src/b.js') || r.blastRadius >= 2);
});
