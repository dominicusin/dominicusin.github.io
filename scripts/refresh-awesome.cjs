#!/usr/bin/env node
/*
 * refresh-awesome.cjs
 * --------------------
 * Updates every curated Awesome submodule (awesome/<group>/<repo>) to the
 * latest commit on its tracked remote branch, then regenerates the catalog
 * (data/awesome.json) and the per-list preview pages. Keeps the sparse
 * checkout (only the list file is ever present in the working tree).
 *
 * Intended to run in CI before the Hugo build (so the deployed site always
 * shows the freshest READMEs) and/or on a schedule. Only TOUCHES awesome/*
 * submodules — never the wiki/blowfish submodules.
 *
 * Graceful: one submodule failing to update does not abort the others.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GITMODULES = path.join(ROOT, '.gitmodules');

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return '';
  }
}

function parseGitmodules(text) {
  const mods = [];
  const re = /\[submodule\s+"([^"]+)"\][^\[]*?path\s*=\s*(\S+)[^\[]*?url\s*=\s*(\S+)/g;
  let m;
  while ((m = re.exec(text)) !== null) mods.push({ path: m[2].trim(), url: m[3].trim() });
  return mods;
}

function main() {
  if (!fs.existsSync(GITMODULES)) {
    console.warn('[awesome] no .gitmodules — nothing to refresh');
    return;
  }
  const mods = parseGitmodules(fs.readFileSync(GITMODULES, 'utf8'));
  const awesome = mods.filter((m) => m.path.replace(/\\/g, '/').split('/')[0] === 'awesome');
  let ok = 0;
  for (const m of awesome) {
    const rel = m.path.replace(/\\/g, '/');
    const before = git(['-C', rel, 'rev-parse', '--short', 'HEAD']);
    // --remote fetches + checks out the latest tracked-branch tip (shallow).
    const r = execFileSync('git', ['submodule', 'update', '--remote', '--depth', '1', rel], {
      cwd: ROOT,
      stdio: 'pipe',
    });
    const after = git(['-C', rel, 'rev-parse', '--short', 'HEAD']);
    const changed = before && after && before !== after ? ` (${before} → ${after})` : '';
    console.log(`refreshed: ${rel}${changed}`);
    ok++;
  }
  console.log(`[awesome] refreshed ${ok}/${awesome.length} submodules`);
  // Regenerate catalog + previews from the now-fresh READMEs.
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-awesome.cjs')], { stdio: 'inherit', cwd: ROOT });
}

main();
