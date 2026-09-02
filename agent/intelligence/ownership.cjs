'use strict';
const fs = require('fs');
const path = require('path');

function parseCodeowners(content) {
  const rules = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    const pattern = parts[0];
    const owners = parts.slice(1);
    if (owners.length === 0) continue;
    rules.push({ pattern, owners, raw: line });
  }
  return rules;
}

function matchPattern(filePath, pattern) {
  let p = pattern;
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p = `${p}**`;
  const regexStr = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  const re = new RegExp(`^${regexStr}($|/.*)`);
  if (re.test(filePath)) return true;
  if (filePath === p || filePath.startsWith(p.replace(/\*.*/, ''))) return true;
  return filePath.includes(p.replace(/\*/g, '')) && p.includes('*') ? re.test(filePath) : filePath.startsWith(p.replace(/\*/g, ''));
}

function capabilityFromPath(filePath, team) {
  if (team) {
    const t = team.toLowerCase();
    if (t.includes('frontend') || filePath.startsWith('src/')) return 'frontend';
    if (t.includes('agent')) return 'agent';
    if (t.includes('contracts')) return 'contracts';
    if (t.includes('content')) return 'content';
    if (t.includes('security')) return 'security';
    if (t.includes('performance')) return 'performance';
  }
  if (filePath.startsWith('agent/memory')) return 'memory';
  if (filePath.startsWith('agent/intelligence')) return 'intelligence';
  if (filePath.startsWith('agent/')) return 'agent';
  if (filePath.startsWith('src/')) return 'frontend';
  if (filePath.startsWith('contracts/')) return 'contracts';
  if (filePath.startsWith('content/')) return 'content';
  if (filePath.startsWith('scripts/')) return 'scripts';
  if (filePath.startsWith('layouts/')) return 'layouts';
  if (filePath.startsWith('.github/')) return 'ci';
  if (filePath.startsWith('static/')) return 'static';
  if (filePath.endsWith('.sol')) return 'contracts';
  return 'general';
}

function buildOwnershipMap(rootDir, opts = {}) {
  const root = path.resolve(rootDir || process.cwd());
  const codeownersPaths = [
    path.join(root, '.github', 'CODEOWNERS'),
    path.join(root, 'CODEOWNERS'),
    path.join(root, 'docs', 'CODEOWNERS')
  ];
  let rules = [];
  let sourceFile = null;
  for (const p of codeownersPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        rules = parseCodeowners(content);
        sourceFile = p;
        break;
      } catch (_) {}
    }
  }

  const gitHistory = opts.gitHistory || null;

  const map = {};

  function resolveOwner(filePath) {
    for (let i = rules.length - 1; i >= 0; i--) {
      const r = rules[i];
      if (matchPattern(filePath, r.pattern)) {
        const team = r.owners[0];
        return { team, capability: capabilityFromPath(filePath, team), confidence: 'high', source: 'CODEOWNERS', pattern: r.pattern };
      }
    }
    if (gitHistory && gitHistory[filePath]) {
      const entries = gitHistory[filePath];
      const sorted = [...entries].sort((a, b) => b.count - a.count);
      const top = sorted[0];
      return { team: top.author, capability: capabilityFromPath(filePath, top.author), confidence: 'medium', source: 'git-history', commits: top.count };
    }
    if (!gitHistory) {
      try {
        const { execSync } = require('child_process');
        const out = execSync(`git log --follow --format="%an" -- "${filePath}" 2>/dev/null | sort | uniq -c | sort -rn | head -5`, { cwd: root, encoding: 'utf8', timeout: 2000 });
        const lines = out.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const first = lines[0].trim().split(/\s+/);
          const count = parseInt(first[0], 10);
          const author = first.slice(1).join(' ');
          if (author) return { team: author, capability: capabilityFromPath(filePath, author), confidence: 'medium', source: 'git-history', commits: count };
        }
      } catch (_) {}
    }
    const heuristic = inferHeuristic(filePath);
    return { team: heuristic.team, capability: heuristic.capability, confidence: 'low', source: 'heuristic' };
  }

  function inferHeuristic(filePath) {
    const dir = path.dirname(filePath).split(path.sep)[0];
    const cap = capabilityFromPath(filePath, null);
    return { team: `@team-${cap}`, capability: cap };
  }

  return {
    _rules: rules,
    _sourceFile: sourceFile,
    _gitHistory: gitHistory,
    _root: root,
    _cache: new Map(),
    resolve(filePath) { return resolveOwner(filePath); }
  };
}

function getOwner(map, filePath) {
  if (!filePath) return null;
  if (map._cache && map._cache.has(filePath)) return map._cache.get(filePath);
  const owner = map.resolve(filePath);
  if (map._cache) map._cache.set(filePath, owner);
  return owner;
}

module.exports = { buildOwnershipMap, getOwner, parseCodeowners, capabilityFromPath };
