#!/usr/bin/env node
/**
 * @fileoverview CI Content Contract gate (Vector A foundation)
 *
 * Enforces the formal Content Model (schema/post-metadata.schema.json) as a
 * publishing contract. Two tiers, by change type:
 *   - ADDED posts   -> HARD gate (exit 1 if any new post is invalid). New
 *                      publications MUST satisfy the schema before merge.
 *   - MODIFIED posts -> SOFT gate (reported, never fails the build). Legacy
 *                      corpus (e.g. 2015 posts lacking tags/author) may carry
 *                      historical violations we do not retroactively enforce.
 *   - Knowledge Graph (JSON-LD) is always emitted for the whole corpus.
 *
 * Post detection (git):
 *   - Base = merge-base(origin/main, HEAD); diff against that isolates posts
 *     introduced by the current branch/PR (robust on push-to-main after merge).
 *     A three-dot range (origin/main...HEAD) mis-flags the entire blog as
 *     "added" after a squash merge, wrongly hard-blocking the deploy.
 *   - Fallback: HEAD~1 HEAD (single-commit push), then all posts.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_RE = /^content\/blog\/.*\.(md|markdown)$/;

function runGit(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// Resolve the merge base with origin/main. Returns { base, reliable } —
// `reliable` is false only when git/merge-base could not run at all. A
// legitimately empty diff (zero new posts) is NOT treated as "could not
// determine" (that previously forced gating of ALL posts).
function baseRef() {
  const mb = runGit(['merge-base', 'origin/main', 'HEAD']);
  if (mb) return { base: mb, reliable: true };
  return { base: 'HEAD~1', reliable: true };
}

function diffNames(...spec) {
  return runGit(['diff', '--name-only', ...spec]);
}

function diffAdded(...spec) {
  return runGit(['diff', '--diff-filter=A', '--name-only', ...spec]);
}

function allPosts() {
  return fs.readdirSync(path.join(ROOT, 'content', 'blog'))
    .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
    .map(f => path.join('content', 'blog', f));
}

function getChangedPosts() {
  const { base, reliable } = baseRef();
  const out = diffNames(base, 'HEAD');
  if (!reliable) {
    console.log('⚠️  Could not determine changed files; falling back to all posts.');
    return allPosts();
  }
  return out.split('\n').filter(line => POSTS_RE.test(line.trim())).map(l => l.trim());
}

function getAddedPosts() {
  const { base, reliable } = baseRef();
  const out = diffAdded(base, 'HEAD');
  if (!reliable) {
    // No git context — treat every post as a candidate new post so the hard
    // gate still protects the corpus if the runner lacks history.
    return allPosts();
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
  const added = getAddedPosts();
  const modified = changed.filter(f => !added.includes(f));

  console.log(`\n🔎 Content Contract: ${changed.length} changed, ${added.length} added (hard gate), ${modified.length} modified (report-only)\n`);

  // 1. HARD gate: new posts MUST satisfy the schema.
  if (added.length > 0) {
    let gateFailed = false;
    for (const file of added) {
      const ok = spawnOk('node', [path.join('scripts', 'validate-frontmatter.cjs'), file]);
      if (!ok) gateFailed = true;
    }
    if (gateFailed) {
      console.error('\n❌ Content Model contract FAILED for NEW post(s). Fix frontmatter before merge — new publications are blocked.');
      process.exit(1);
    }
    console.log('✅ Content Model contract satisfied for all new posts.');
  } else {
    console.log('✅ No new posts — hard gate vacuously satisfied.');
  }

  // 2. SOFT gate: AI review on changed posts (informational, never fails).
  for (const file of changed) {
    spawnOk('node', [path.join('scripts', 'ai-review.cjs'), file]);
  }

  // 3. Emit Knowledge Graph (JSON-LD) for all posts.
  console.log('\n🕸️  Building Knowledge Graph (JSON-LD)...');
  spawnOk('node', [path.join('scripts', 'build-knowledge-graph.cjs')]);

  console.log('\n🎉 Content contract job complete.');
}

main();
