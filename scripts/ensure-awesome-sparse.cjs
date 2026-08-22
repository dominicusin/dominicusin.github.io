#!/usr/bin/env node
/*
 * ensure-awesome-sparse.cjs
 * --------------------------
 * Re-applies sparse-checkout (list file only) to every awesome submodule
 * under content/awesome. CI does `git submodule update --init --recursive`,
 * which checks out the FULL tree; this trims each working tree back to just
 * its README/list file (matches the local sparse setup and keeps clones lean).
 *
 * Idempotent and graceful: missing/failed submodules are skipped.
 *
 * SECURITY: execFileSync('git', [args]) with discrete arg array; all values
 * derived from the hardcoded list-file detection, no external input.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
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

function main() {
  const gm = path.join(ROOT, '.gitmodules');
  if (!fs.existsSync(gm)) { console.warn('[awesome] no .gitmodules'); return; }
  const txt = fs.readFileSync(gm, 'utf8');
  const re = /\[submodule\s+"([^"]+)"\][^\[]*?path\s*=\s*(\S+)/g;
  let m, n = 0;
  while ((m = re.exec(txt)) !== null) {
    const rel = m[2].trim();
    if (!rel.startsWith('awesome/')) continue;
    const sub = path.join(ROOT, rel);
    if (!fs.existsSync(sub)) continue;
    const list = detectListFile(rel);
    if (!list) continue;
    try {
      execFileSync('git', ['-C', sub, 'sparse-checkout', 'init', '--cone'], { stdio: 'pipe' });
      execFileSync('git', ['-C', sub, 'sparse-checkout', 'set', '--no-cone', '/' + list], { stdio: 'pipe' });
      console.log(`sparse: ${rel} -> /${list}`);
      n++;
    } catch (e) {
      console.warn(`skip ${rel}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`[awesome] ensured sparse checkout on ${n} submodules`);
}

main();
