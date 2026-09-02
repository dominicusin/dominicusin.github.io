'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function listFilesRecursively(root, relBase = '') {
  const entries = [];
  const absBase = path.join(root, relBase);
  if (!fs.existsSync(absBase)) return entries;
  const items = fs.readdirSync(absBase, { withFileTypes: true });
  for (const it of items) {
    if (it.name.startsWith('.git') || it.name === 'node_modules' || it.name === 'public' || it.name === 'resources' || it.name === '.hugo_build.lock') continue;
    const rel = path.join(relBase, it.name);
    const abs = path.join(root, rel);
    if (it.isDirectory()) {
      entries.push(...listFilesRecursively(root, rel));
    } else if (it.isFile()) {
      if (/\.(js|cjs|mjs|ts|sol|html|toml|yaml|yml|json|md|cjs)$/.test(it.name)) {
        entries.push(rel);
      } else if (!it.name.includes('.') || /\.(cjs|js)$/.test(rel)) {
        entries.push(rel);
      } else {
        entries.push(rel);
      }
    }
  }
  return entries;
}

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

function parseImports(content, fileDir) {
  const deps = [];
  const re = /(?:import\s+(?:.*?from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const raw = m[1] || m[2] || m[3];
    if (!raw) continue;
    if (raw.startsWith('.')) {
      const resolved = path.normalize(path.join(fileDir, raw));
      const withExt = resolved.endsWith('.js') || resolved.endsWith('.cjs') || resolved.endsWith('.mjs') || resolved.endsWith('.sol') ? resolved : resolved;
      deps.push(withExt);
    } else if (!raw.startsWith('/') && !raw.startsWith('http')) {
      deps.push(`package:${raw.split('/')[0]}`);
    }
  }
  return deps;
}

function loadBeadsArtifacts(root) {
  const beadsPath = path.join(root, '.beads', 'beads.json');
  if (!fs.existsSync(beadsPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(beadsPath, 'utf8'));
    return data.nodes || [];
  } catch (_) {
    return [];
  }
}

function buildRepositoryGraph(rootDir, opts = {}) {
  const root = path.resolve(rootDir || process.cwd());
  const allFiles = [];
  const candidates = [
    'src', 'agent', 'contracts', 'scripts', 'layouts', 'config', 'content', 'static', 'themes', '.github', 'i18n', 'assets'
  ];
  for (const c of candidates) {
    const abs = path.join(root, c);
    if (fs.existsSync(abs)) {
      const files = listFilesRecursively(root, c);
      allFiles.push(...files);
    }
  }
  const rootFiles = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isFile() && /\.(json|js|cjs|toml|yaml|md)$/.test(f)).map(f => f);
  allFiles.push(...rootFiles);

  const uniqueFiles = [...new Set(allFiles)].sort();
  const nodes = [];
  const edges = [];
  const moduleSet = new Set();

  for (const f of uniqueFiles) {
    const mod = inferModule(f);
    moduleSet.add(mod);
    nodes.push({ id: f, type: 'file', module: mod });
  }
  for (const m of moduleSet) {
    nodes.push({ id: m, type: 'module' });
  }
  for (const f of uniqueFiles) {
    const mod = inferModule(f);
    edges.push({ from: f, to: mod, type: 'belongs-to' });
  }

  for (const f of uniqueFiles) {
    if (!/\.(js|cjs|mjs|ts)$/.test(f)) continue;
    const abs = path.join(root, f);
    if (!fs.existsSync(abs)) continue;
    let content;
    try { content = fs.readFileSync(abs, 'utf8'); } catch (_) { continue; }
    const dir = path.dirname(f);
    const deps = parseImports(content, dir);
    for (const dep of deps) {
      if (dep.startsWith('package:')) {
        edges.push({ from: f, to: dep, type: 'depends' });
        if (!nodes.some(n => n.id === dep)) nodes.push({ id: dep, type: 'package' });
      } else {
        let target = dep;
        const candidates2 = [target, `${target}.js`, `${target}.cjs`, `${target}.mjs`, path.join(target, 'index.js')];
        let resolved = null;
        for (const cand of candidates2) {
          if (uniqueFiles.includes(cand)) { resolved = cand; break; }
        }
        if (!resolved) {
          const base = path.basename(target);
          const match = uniqueFiles.find(u => path.basename(u) === base || u.endsWith(target));
          if (match) resolved = match;
        }
        if (resolved) {
          edges.push({ from: f, to: resolved, type: 'imports' });
        } else {
          edges.push({ from: f, to: target, type: 'imports' });
        }
      }
    }
  }

  const beadsNodes = loadBeadsArtifacts(root);
  for (const n of beadsNodes) {
    if (!n.artifacts || !Array.isArray(n.artifacts)) continue;
    for (const art of n.artifacts) {
      edges.push({ from: n.id, to: art, type: 'task-owns' });
      if (!nodes.some(x => x.id === art)) {
        const mod = inferModule(art);
        nodes.push({ id: art, type: 'file', module: mod });
      }
      if (!nodes.some(x => x.id === n.id)) {
        nodes.push({ id: n.id, type: 'task' });
      }
    }
  }

  const ciFiles = uniqueFiles.filter(f => f.startsWith('.github/workflows/'));
  for (const cf of ciFiles) {
    let content = '';
    try { content = fs.readFileSync(path.join(root, cf), 'utf8'); } catch (_) {}
    const artifacts = [...content.matchAll(/['"]([^'"]+\.(cjs|js|toml|yml|yaml))['"]/g)].map(m => m[1]);
    for (const art of artifacts) {
      const modArt = art.replace(/^\.\//, '');
      if (uniqueFiles.includes(modArt)) {
        edges.push({ from: cf, to: modArt, type: 'ci-covers' });
      }
    }
  }

  return { nodes, edges, meta: { root, fileCount: uniqueFiles.length, moduleCount: moduleSet.size, builtAt: new Date().toISOString() } };
}

function updateGraph(graph, diff, rootDir) {
  const added = (diff.added || []).slice();
  const removed = (diff.removed || []).slice();
  const modified = (diff.modified || []).slice();
  const nodes = graph.nodes.slice();
  const edges = graph.edges.slice();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const f of removed) {
    const idx = nodes.findIndex(n => n.id === f);
    if (idx !== -1) nodes.splice(idx, 1);
    for (let i = edges.length - 1; i >= 0; i--) {
      if (edges[i].from === f || edges[i].to === f) edges.splice(i, 1);
    }
  }

  for (const f of added) {
    if (!nodeIds.has(f)) {
      const mod = inferModule(f);
      nodes.push({ id: f, type: 'file', module: mod });
      if (!nodes.some(n => n.id === mod)) nodes.push({ id: mod, type: 'module' });
      edges.push({ from: f, to: mod, type: 'belongs-to' });
      if (/\.(js|cjs|mjs|ts)$/.test(f) && rootDir) {
        const abs = path.join(rootDir, f);
        if (fs.existsSync(abs)) {
          try {
            const content = fs.readFileSync(abs, 'utf8');
            const deps = parseImports(content, path.dirname(f));
            for (const dep of deps) {
              edges.push({ from: f, to: dep, type: dep.startsWith('package:') ? 'depends' : 'imports' });
            }
          } catch (_) {}
        }
      }
    }
  }

  for (const f of modified) {
    for (let i = edges.length - 1; i >= 0; i--) {
      if (edges[i].from === f && (edges[i].type === 'imports' || edges[i].type === 'depends')) edges.splice(i, 1);
    }
    if (/\.(js|cjs|mjs|ts)$/.test(f) && rootDir) {
      const abs = path.join(rootDir, f);
      if (fs.existsSync(abs)) {
        try {
          const content = fs.readFileSync(abs, 'utf8');
          const deps = parseImports(content, path.dirname(f));
          for (const dep of deps) {
            edges.push({ from: f, to: dep, type: dep.startsWith('package:') ? 'depends' : 'imports' });
          }
        } catch (_) {}
      }
    }
  }

  return { nodes, edges, meta: { ...graph.meta, updatedAt: new Date().toISOString() } };
}

function createSnapshot(graph) {
  const payload = JSON.stringify({ nodes: graph.nodes, edges: graph.edges });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return { nodes: graph.nodes, edges: graph.edges, meta: graph.meta, timestamp: new Date().toISOString(), hash };
}

module.exports = { buildRepositoryGraph, updateGraph, createSnapshot, inferModule, parseImports };
