#!/usr/bin/env node
/*
 * discover-awesome.cjs
 * ---------------------
 * Finds new curated Awesome lists on GitHub and adds them as sparse submodules
 * under content/awesome/<group>/<repo>. Intended to be run by the scheduled
 * awesome-discover GitHub Actions workflow (with a GITHUB_TOKEN for a higher
 * search rate limit), but also works locally.
 *
 * Strategy:
 *   1. Search GitHub for `topic:awesome` repos above a star threshold.
 *   2. Drop any already present in .gitmodules.
 *   3. Map each candidate's topics/name to one of our groups.
 *   4. Add up to MAX_NEW new lists as sparse (README-only) submodules.
 *
 * Graceful: network/API failures yield zero additions rather than throwing.
 *
 * SECURITY: execFileSync('git', [args]) with discrete arg arrays; the GitHub
 * API input (repo full_name) is URL/path-escaped and only used as a git remote
 * URL / submodule path we construct ourselves — no shell interpolation of
 * untrusted response fields into commands.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MAX_NEW = parseInt(process.env.AWESOME_MAX_NEW || '3', 10);
const MIN_STARS = parseInt(process.env.AWESOME_MIN_STARS || '800', 10);
const PER_PAGE = 50;

const GROUP_BY_TOPIC = {
  nix: 'devops', kubernetes: 'devops', docker: 'devops', devops: 'devops',
  k8s: 'devops', terraform: 'devops', ansible: 'devops', ci: 'devops',
  security: 'security', cybersecurity: 'security', pentest: 'security',
  hacking: 'security', ctf: 'security', privacy: 'security',
  machinelearning: 'data', 'machine-learning': 'data', ml: 'data', deeplearning: 'data',
  data: 'data', datascience: 'data', 'data-science': 'data', mlops: 'data',
  web: 'web', frontend: 'web', 'front-end': 'web', css: 'web', javascript: 'web',
  react: 'web', vue: 'web', svelte: 'web',
  blockchain: 'blockchain', ethereum: 'blockchain', web3: 'blockchain', defi: 'blockchain',
  bitcoin: 'blockchain', crypto: 'blockchain', dao: 'blockchain', solana: 'blockchain',
  rust: 'systems', go: 'systems', golang: 'systems', cpp: 'systems', c: 'systems',
  systems: 'systems', programming: 'systems', languages: 'systems', compilers: 'systems',
  python: 'development', nodejs: 'development', node: 'development',
  typescript: 'development', java: 'development', php: 'development',
  'awesome': 'tools', macos: 'tools', mac: 'tools', linux: 'tools',
  vim: 'tools', neovim: 'tools', selfhosted: 'tools', selfhosting: 'tools',
  awesome: 'tools',
};

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function alreadyAdded(fullName) {
  const gm = path.join(ROOT, '.gitmodules');
  if (!fs.existsSync(gm)) return false;
  return fs.readFileSync(gm, 'utf8').includes(`github.com/${fullName}`);
}

function guessGroup(topics, name) {
  const hay = [...(topics || []).map((t) => t.toLowerCase()), name.toLowerCase()];
  for (const t of hay) {
    if (GROUP_BY_TOPIC[t]) return GROUP_BY_TOPIC[t];
  }
  for (const t of hay) {
    for (const key of Object.keys(GROUP_BY_TOPIC)) {
      if (t.includes(key)) return GROUP_BY_TOPIC[key];
    }
  }
  return 'tools';
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function searchAwesome() {
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/search/repositories?q=topic:awesome+stars:%3E${MIN_STARS}&sort=stars&order=desc&per_page=${PER_PAGE}`;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'awesome-discover' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);
  const json = await res.json();
  return json.items || [];
}

function detectListFile(rel) {
  const files = git(['-C', rel, 'ls-files']).split('\n').filter(Boolean);
  const cands = files.filter((f) => f.toLowerCase().endsWith('readme.md'));
  if (!cands.length) return 'README.md';
  const score = (f) => (f.toLowerCase() === 'readme.md' ? 0 : f.toLowerCase().endsWith('/readme.md') ? 1 : 2);
  cands.sort((a, b) => score(a) - score(b));
  return cands[0];
}

function addSubmodule(group, slug, url, fullName) {
  const rel = `awesome/${group}/${slug}`;
  if (fs.existsSync(path.join(ROOT, rel))) return false;
  if (!fs.existsSync(path.join(ROOT, '.gitmodules'))) fs.writeFileSync(path.join(ROOT, '.gitmodules'), '');
  execFileSync('git', ['submodule', 'add', '--depth', '1', url, rel], { stdio: 'pipe' });
  const sub = path.join(ROOT, rel);
  execFileSync('git', ['-C', sub, 'sparse-checkout', 'init', '--cone'], { stdio: 'pipe' });
  const list = detectListFile(sub);
  execFileSync('git', ['-C', sub, 'sparse-checkout', 'set', '--no-cone', '/' + list], { stdio: 'pipe' });
  console.log(`discovered+added: ${rel} (${fullName}, list=${list})`);
  return true;
}

async function main() {
  let items = [];
  try {
    items = await searchAwesome();
  } catch (e) {
    console.warn(`[discover] search failed: ${e.message} — no additions`);
    process.exit(0);
  }
  const candidates = items.filter((it) => !alreadyAdded(it.full_name));
  let added = 0;
  for (const it of candidates) {
    if (added >= MAX_NEW) break;
    const group = guessGroup(it.topics, it.name);
    const slug = slugify(it.name);
    try {
      if (addSubmodule(group, slug, it.html_url, it.full_name)) added++;
    } catch (e) {
      console.warn(`[discover] skip ${it.full_name}: ${e.message.split('\n')[0]}`);
      // roll back partial registration
      const rel = `awesome/${group}/${slug}`;
      try { execFileSync('git', ['submodule', 'deinit', '-f', rel], { stdio: 'pipe' }); } catch {}
      try { execFileSync('git', ['config', '--remove-section', `submodule.${rel}`], { stdio: 'pipe' }); } catch {}
      try { fs.rmSync(path.join(ROOT, rel), { recursive: true, force: true }); } catch {}
    }
  }
  console.log(`[discover] added ${added} new awesome list(s)`);
  process.exit(0);
}

main();
