#!/usr/bin/env node
/**
 * @fileoverview Backfill missing `author` frontmatter on legacy posts.
 *
 * Many pre-migration posts lack `author`. The content-contract hard gate only
 * blocks NEW posts, so legacy posts are not enforced — but adding a consistent
 * `author` improves SEO / structured data. This script is deliberately
 * conservative: it adds ONLY `author` (always valid, no enum), and never
 * invents `categories`/`tags` (those need editorial judgement).
 *
 * Usage:
 *   node scripts/backfill-frontmatter.cjs            # dry-run (reports only)
 *   node scripts/backfill-frontmatter.cjs --write    # actually edits files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'content', 'blog');
const DEFAULT_AUTHOR = 'DominicusIn';
const WRITE = process.argv.includes('--write');

// Matches a top-level `author:` (or `author: [...]` list) frontmatter key.
const AUTHOR_RE = /^\s*author\s*:/m;

function frontmatterBounds(body) {
  if (!body.startsWith('---')) return null;
  const end = body.indexOf('\n---', 3);
  if (end === -1) return null;
  return { start: 0, end: end + 4, fm: body.slice(0, end + 4) };
}

function backfillFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const bounds = frontmatterBounds(raw);
  if (!bounds) return { file, changed: false, reason: 'no frontmatter' };
  if (AUTHOR_RE.test(bounds.fm)) return { file, changed: false, reason: 'has author' };

  const before = raw.slice(0, bounds.end);
  const after = raw.slice(bounds.end);
  const updated = `${before}\nauthor: ${DEFAULT_AUTHOR}\n${after}`;

  if (WRITE) fs.writeFileSync(file, updated, 'utf8');
  return { file, changed: true, reason: 'added author' };
}

function main() {
  const files = fs.readdirSync(BLOG)
    .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
    .map(f => path.join(BLOG, f));

  let touched = 0;
  for (const f of files) {
    const r = backfillFile(f);
    if (r.changed) {
      touched++;
      console.log(`${WRITE ? 'WRITE ' : 'would '}author -> ${path.basename(f)}`);
    }
  }
  console.log(`\n${WRITE ? 'Backfilled' : 'Dry-run'}: ${touched} post(s) need/will get author.`);
  if (!WRITE) console.log('Run with --write to apply.');
}

main();
