#!/usr/bin/env node
/*
 * add-awesome-submodules.cjs
 * --------------------------
 * Idempotently adds curated Awesome lists as git submodules under
 * awesome/<group>/<repo> (repo root, NOT under content/ so Hugo never
 * renders the README as a page), each with sparse-checkout limited to its
 * list file (README.md / readme.md / docs/README.md / ...). The list
 * filename is detected per-repo (case-insensitive) so repos that keep the
 * list under a different name/path still work.
 *
 * Resilient: one repo failing (404 / network) does not abort the others.
 *
 * IMPORTANT git gotcha: `git submodule add` requires .gitmodules to ALREADY
 * exist in the working tree — it appends to it, it does not create it. So we
 * `touch .gitmodules` first if missing.
 *
 * Run: node scripts/add-awesome-submodules.cjs
 *
 * SECURITY: uses execFileSync('git', [args]) with a discrete argument array
 * (no shell). Every value comes from the hardcoded REPOS constant below — no
 * user-supplied or external input is interpolated, so no injection surface.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SUB_BASE = 'awesome'; // repo-root dir (kept out of content/)

// Curated set: [group, repo-slug, github-url]
const REPOS = [
  ['development', 'awesome-python', 'https://github.com/vinta/awesome-python'],
  ['development', 'awesome-nodejs', 'https://github.com/sindresorhus/awesome-nodejs'],
  ['devops', 'awesome-nix', 'https://github.com/nix-community/awesome-nix'],
  ['devops', 'awesome-kubernetes', 'https://github.com/ramitsurana/awesome-kubernetes'],
  ['security', 'awesome-security', 'https://github.com/sbilly/awesome-security'],
  ['data', 'awesome-machine-learning', 'https://github.com/josephmisiti/awesome-machine-learning'],
  ['web', 'frontend-dev-bookmarks', 'https://github.com/dypsilon/frontend-dev-bookmarks'],
  ['systems', 'papers-we-love', 'https://github.com/papers-we-love/papers-we-love'],
  ['blockchain', 'awesome-blockchain', 'https://github.com/yjjnls/awesome-blockchain'],
  ['tools', 'awesome-mac', 'https://github.com/jaywcjlove/awesome-mac'],
];

function run(args, cwd) {
  execFileSync('git', args, { cwd: cwd || ROOT, stdio: 'pipe' });
}

function git(args, cwd) {
  try { return execFileSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch (e) { return ''; }
}

function alreadyAdded(relPath) {
  const gm = path.join(ROOT, '.gitmodules');
  if (!fs.existsSync(gm)) return false;
  return fs.readFileSync(gm, 'utf8').includes(`path = ${relPath}`);
}

function detectListFile(rel) {
  const files = git(['-C', rel, 'ls-files']).split('\n').filter(Boolean);
  const cands = files.filter((f) => f.toLowerCase().endsWith('readme.md'));
  if (!cands.length) return null;
  const score = (f) => {
    const l = f.toLowerCase();
    if (l === 'readme.md') return 0;
    if (l.endsWith('/readme.md')) return 1;
    return 2;
  };
  cands.sort((a, b) => score(a) - score(b));
  return cands[0];
}

function addOne(group, slug, url) {
  const rel = `${SUB_BASE}/${group}/${slug}`;
  if (alreadyAdded(rel)) {
    console.log(`skip (already in .gitmodules): ${rel}`);
    return true;
  }
  try {
    if (!fs.existsSync(path.join(ROOT, '.gitmodules'))) fs.writeFileSync(path.join(ROOT, '.gitmodules'), '');
    run(['submodule', 'add', '--depth', '1', url, rel]);
    const sub = path.join(ROOT, rel);
    run(['-C', sub, 'sparse-checkout', 'init', '--cone']);
    const listFile = detectListFile(sub) || 'README.md';
    run(['-C', sub, 'sparse-checkout', 'set', '--no-cone', '/' + listFile]);
    const files = fs.readdirSync(sub).filter((f) => f !== '.git');
    console.log(`added: ${rel} -> [${files.join(', ')}] (list=${listFile})`);
    return true;
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString() : e.message;
    console.warn(`FAILED: ${rel}: ${msg.split('\n')[0]}`);
    try { run(['submodule', 'deinit', '-f', rel]); } catch {}
    try { run(['config', '--remove-section', `submodule.${rel}`]); } catch {}
    try { fs.rmSync(path.join(ROOT, rel), { recursive: true, force: true }); } catch {}
    return false;
  }
}

let ok = 0;
for (const [g, s, u] of REPOS) ok += addOne(g, s, u) ? 1 : 0;
console.log(`\n[awesome] ${ok}/${REPOS.length} submodules configured`);
process.exit(0);
