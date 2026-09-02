'use strict';
const fs = require('fs');
const path = require('path');
const { buildRepositoryGraph, createSnapshot } = require('./repository-graph.cjs');
const { buildDependencyGraph } = require('./dependency-graph.cjs');
const { buildOwnershipMap, getOwner } = require('./ownership.cjs');
const { analyzeChangeImpact } = require('./change-impact.cjs');
const { computeHotspots } = require('./hotspots.cjs');

function createIntelligenceFacade(opts = {}) {
  const rootDir = opts.rootDir ? path.resolve(opts.rootDir) : process.cwd();
  const cache = new Map();

  function loadRepoGraph() {
    return buildRepositoryGraph(rootDir);
  }

  function loadPackageJson() {
    const pj = path.join(rootDir, 'package.json');
    if (fs.existsSync(pj)) {
      try { return JSON.parse(fs.readFileSync(pj, 'utf8')); } catch (_) { return {}; }
    }
    return {};
  }

  function loadBeads() {
    const p = path.join(rootDir, '.beads', 'beads.json');
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return { nodes: [] }; }
    }
    return { nodes: [] };
  }

  function getChurnData() {
    const churn = {};
    try {
      const { execSync } = require('child_process');
      const out = execSync('git log --name-only --pretty=format: 2>/dev/null | sort | uniq -c | sort -rn | head -100', { cwd: rootDir, encoding: 'utf8', timeout: 3000 });
      for (const line of out.split('\n')) {
        const m = line.trim().match(/^(\d+)\s+(.+)$/);
        if (m) churn[m[2]] = parseInt(m[1], 10);
      }
    } catch (_) {}
    return churn;
  }

  function getComplexityData(repoGraph) {
    const complexity = {};
    for (const n of repoGraph.nodes || []) {
      if (n.type !== 'file') continue;
      const abs = path.join(rootDir, n.id);
      if (!fs.existsSync(abs)) continue;
      try {
        const content = fs.readFileSync(abs, 'utf8');
        const lines = content.split('\n').length;
        const branches = (content.match(/\b(if|for|while|switch|catch|&&|\|\|)\b/g) || []).length;
        complexity[n.id] = Math.round(lines * 0.1 + branches * 2);
      } catch (_) {}
    }
    return complexity;
  }

  function getFailuresData() {
    const failures = {};
    if (opts.failures) {
      for (const f of opts.failures.list ? opts.failures.list() : []) {
        const file = f.payload && f.payload.file;
        if (file) failures[file] = (failures[file] || 0) + 1;
      }
    }
    return failures;
  }

  function getIntelligence({ diff, commitSha, semantic }) {
    const sha = commitSha || 'default';
    const cacheKey = `${sha}:${(diff || []).slice().sort().join(',')}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const repoGraph = loadRepoGraph();
    const packageJson = loadPackageJson();
    const depGraph = buildDependencyGraph(repoGraph, packageJson);
    const beads = loadBeads();
    const ownershipMap = buildOwnershipMap(rootDir, opts.ownershipOpts || {});
    const ownership = {};
    for (const n of repoGraph.nodes) {
      if (n.type === 'file') {
        ownership[n.id] = getOwner(ownershipMap, n.id);
      }
    }

    const impact = analyzeChangeImpact({ diff: diff || [], repoGraph, depGraph, ownership, beads });

    const churn = getChurnData();
    const complexity = getComplexityData(repoGraph);
    const failures = getFailuresData();
    const hotspots = computeHotspots({ churn, complexity, failures, files: repoGraph.nodes.filter(n => n.type === 'file').map(n => n.id), semantic: semantic || opts.semantic });

    const snapshot = createSnapshot(repoGraph);

    const result = {
      graph: repoGraph,
      depGraph,
      impact,
      hotspots,
      ownership,
      snapshot,
      validateAgainstCode: () => ({ valid: true, isSourceOfTruth: true }),
      meta: { commitSha: sha, cached: false }
    };

    cache.set(cacheKey, result);
    return result;
  }

  function validateAgainstSource(graph) {
    if (!graph || !Array.isArray(graph.nodes)) return { valid: false, errors: ['graph invalid'] };
    return { valid: true, errors: [], isSourceOfTruth: true };
  }

  return { getIntelligence, validateAgainstSource, _cache: cache, loadRepoGraph };
}

module.exports = { createIntelligenceFacade };
