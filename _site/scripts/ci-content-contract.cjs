#!/usr/bin/env node
/**
 * @fileoverview CI Content Contract gate (Vector A foundation)
 *
 * Runs the Agent-driven Publishing Protocol checks on CHANGED posts only,
 * so the formal Content Model (schema/post-metadata.schema.json) is enforced
 * as a pre-merge gate without retroactively failing the legacy corpus:
 *   1. validate-frontmatter  -> hard gate (exit 1 if any changed post invalid)
 *   2. ai-review             -> soft gate (warnings, never fails the build)
 *   3. build-knowledge-graph -> emits assets/data/knowledge-graph.json (JSON-LD)
 *
 * Changed post detection:
 *   - PR context:  git diff --name-only origin/main...HEAD
 *   - Push context: git diff --name-only HEAD~1 HEAD
 *   - fallback:     validate ALL posts (so a misconfigured runner still gates)
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_RE = /^_posts\/.*\.(md|markdown)$/;

function runGit(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function getChangedPosts() {
  // PR context
  let out = runGit(['diff', '--name-only', 'origin/main...HEAD']);
  if (!out) {
    // Push context
    out = runGit(['diff', '--name-only', 'HEAD~1', 'HEAD']);
  }
  if (!out) {
    // Fallback: all posts (ensures gate still runs if git is unavailable)
    console.log('⚠️  Could not determine changed files; falling back to all posts.');
    return fs.readdirSync(path.join(ROOT, '_posts'))
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
      .map(f => path.join('_posts', f));
  }
  return out.split('\n').filter(line => POSTS_RE.test(line.trim())).map(l => l.trim());
}

function spawnOk(cmd, cmdArgs) {
  try {
    execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
}

function main() {
  const changed = getChangedPosts();
  console.log(`\n🔎 Content Contract: ${changed.length} changed post(s) detected\n`);

  if (changed.length === 0) {
    console.log('✅ No post changes — content contract vacuously satisfied.');
  } else {
    // 1. Hard gate: frontmatter validation
    let gateFailed = false;
    for (const file of changed) {
      const ok = spawnOk('node', [path.join('scripts', 'validate-frontmatter.cjs'), file]);
      if (!ok) gateFailed = true;
    }
    if (gateFailed) {
      console.error('\n❌ Content Model contract FAILED for changed post(s). Fix frontmatter before merge.');
      process.exit(1);
    }
    console.log('\n✅ Content Model contract satisfied for all changed posts.');

    // 2. Soft gate: AI review (informational)
    for (const file of changed) {
      spawnOk('node', [path.join('scripts', 'ai-review.cjs'), file]);
    }
  }

  // 3. Emit Knowledge Graph (JSON-LD) for all posts
  console.log('\n🕸️  Building Knowledge Graph (JSON-LD)...');
  spawnOk('node', [path.join('scripts', 'build-knowledge-graph.cjs')]);

  console.log('\n🎉 Content contract job complete.');
}

main();
