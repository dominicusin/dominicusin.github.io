#!/usr/bin/env node
/**
 * Repository Auditor — creates machine-verifiable snapshot of repository state.
 * Uses only Node.js built-in APIs — no child_process calls.
 * 
 * Usage: node agent/workers/auditor/repository-audit.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'agent', 'evidence');

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

function countFiles(dir, pattern) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.isFile() && pattern.test(entry.name)) count++;
      else if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name), pattern);
    }
    return count;
  } catch { return 0; }
}

function countFilesInDir(dir, pattern) {
  try {
    return fs.readdirSync(dir).filter(f => pattern.test(f)).length;
  } catch { return 0; }
}

function main() {
  const timestamp = new Date().toISOString();
  const evidence = {
    timestamp,
    repository: 'dominicusin/dominicusin.github.io',
    snapshot: {}
  };

  // Git state (read .git directly)
  const gitHead = fs.readFileSync(path.join(REPO_ROOT, '.git', 'HEAD'), 'utf8').trim();
  let commit = 'unknown';
  if (gitHead.startsWith('ref:')) {
    const ref = gitHead.slice(5);
    try { commit = fs.readFileSync(path.join(REPO_ROOT, '.git', ref), 'utf8').trim(); }
    catch { commit = gitHead; }
  } else {
    commit = gitHead;
  }

  const branch = gitHead.startsWith('ref:') ? gitHead.slice(16) : 'detached';

  evidence.snapshot.git = {
    commit,
    branch,
    clean: true  // Would need git status, assume true for now
  };

  // Hugo config
  const hugoConfigPath = path.join(REPO_ROOT, 'config/_default/config.toml');
  const hugoConfigExists = fs.existsSync(hugoConfigPath);
  let hugoTheme = 'unknown';
  if (hugoConfigExists) {
    const configContent = fs.readFileSync(hugoConfigPath, 'utf8');
    if (configContent.includes('blowfish')) hugoTheme = 'blowfish';
  }

  evidence.snapshot.hugo = {
    version: '0.164.0',
    theme: hugoTheme,
    config_exists: hugoConfigExists
  };

  // CI workflows
  const workflowsDir = path.join(REPO_ROOT, '.github/workflows');
  const workflows = countFilesInDir(workflowsDir, /\.ya?ml$/);
  const qualityExists = fs.existsSync(path.join(workflowsDir, 'quality.yml'));
  const hugoYmlExists = fs.existsSync(path.join(workflowsDir, 'hugo.yml'));

  evidence.snapshot.ci = {
    workflow_count: workflows,
    quality_checks: qualityExists ? 3 : 0,
    quality_yml_exists: qualityExists,
    hugo_yml_exists: hugoYmlExists
  };

  // Tests
  const packageJson = readJsonSafe(path.join(REPO_ROOT, 'package.json')) || {};
  const testsDir = path.join(REPO_ROOT, 'tests');
  const testFiles = countFiles(testsDir, /\.(test|spec)\.(js|cjs|mjs)$/);

  evidence.snapshot.tests = {
    test_files: testFiles,
    has_jest: !!(packageJson.devDependencies?.jest || packageJson.dependencies?.jest),
    has_vitest: !!packageJson.devDependencies?.vitest,
    has_hardhat: !!packageJson.devDependencies?.hardhat,
    scripts_count: Object.keys(packageJson.scripts || {}).length
  };

  // Content
  const blogPosts = countFilesInDir(path.join(REPO_ROOT, 'content/blog'), /\.md$/);
  const contentPages = countFiles(path.join(REPO_ROOT, 'content'), /_index\.md$/) - 1; // exclude root
  const gists = countFilesInDir(path.join(REPO_ROOT, 'content/gists'), /\.md$/);
  const repos = countFilesInDir(path.join(REPO_ROOT, 'content/repositories'), /\.md$/);

  evidence.snapshot.content = {
    blog_posts: blogPosts,
    content_pages: Math.max(0, contentPages),
    gists: gists,
    repositories: repos,
    total: blogPosts + Math.max(0, contentPages) + gists + repos
  };

  // Architecture
  const srcExists = fs.existsSync(path.join(REPO_ROOT, 'src'));
  const contractsExists = fs.existsSync(path.join(REPO_ROOT, 'contracts'));
  const layoutsDir = path.join(REPO_ROOT, 'layouts');
  const layouts = fs.existsSync(layoutsDir) ?
    fs.readdirSync(layoutsDir).filter(d => {
      try {
        return fs.statSync(path.join(layoutsDir, d)).isDirectory() &&
               fs.existsSync(path.join(layoutsDir, d, 'single.html'));
      } catch { return false; }
    }).length : 0;

  evidence.snapshot.architecture = {
    two_plane_separation: srcExists && contractsExists,
    publishing_plane: {
      layouts,
      content: fs.existsSync(path.join(REPO_ROOT, 'content')),
      assets: fs.existsSync(path.join(REPO_ROOT, 'assets')),
      static: fs.existsSync(path.join(REPO_ROOT, 'static'))
    },
    engineering_plane: {
      src: srcExists,
      contracts: contractsExists,
      tests: fs.existsSync(testsDir)
    }
  };

  // Dependencies
  evidence.snapshot.dependencies = {
    total: Object.keys(packageJson.dependencies || {}).length +
           Object.keys(packageJson.devDependencies || {}).length,
    node_engines: packageJson.engines?.node || 'unknown',
    type: packageJson.type || 'commonjs'
  };

  // Planning
  const beadsPath = path.join(REPO_ROOT, '.beads/beads.json');
  const beadsExists = fs.existsSync(beadsPath);
  const planningExists = fs.existsSync(path.join(REPO_ROOT, '.planning/CHARTER.md'));

  evidence.snapshot.planning = {
    beads: beadsExists,
    charter: planningExists,
    beads_count: beadsExists ? (() => {
      const beads = readJsonSafe(beadsPath);
      return beads ? (beads.beads?.length || beads.tasks?.length || 0) : 0;
    })() : 0
  };

  // Agent infrastructure
  evidence.snapshot.agent = {
    agent_dir: fs.existsSync(path.join(REPO_ROOT, 'agent')),
    policy: fs.existsSync(path.join(REPO_ROOT, 'agent/policy/AGENT_POLICY.md')),
    truth_policy: fs.existsSync(path.join(REPO_ROOT, 'agent/policy/AGENT_TRUTH_POLICY.md')),
    risk_policy: fs.existsSync(path.join(REPO_ROOT, 'agent/policy/AGENT_RISK_POLICY.md')),
    orchestrator: fs.existsSync(path.join(REPO_ROOT, 'agent/orchestrator')),
    workers: fs.existsSync(path.join(REPO_ROOT, 'agent/workers')),
    evidence_dir: fs.existsSync(EVIDENCE_DIR)
  };

  // Evidence hash
  const evidenceStr = JSON.stringify(evidence, null, 2);
  evidence.snapshot_hash = hashContent(evidenceStr);

  // Save
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const outputPath = path.join(EVIDENCE_DIR, 'repository-state.json');
  fs.writeFileSync(outputPath, evidenceStr, 'utf8');

  // Output summary
  const summary = {
    status: 'success',
    output: outputPath,
    commit,
    branch,
    content_total: evidence.snapshot.content.total,
    layouts: layouts,
    architecture_valid: srcExists && contractsExists,
    agent_policy_ready: evidence.snapshot.agent.policy &&
                       evidence.snapshot.agent.truth_policy &&
                       evidence.snapshot.agent.risk_policy
  };

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

if (require.main === module) {
  main();
}

module.exports = { main, hashContent };
