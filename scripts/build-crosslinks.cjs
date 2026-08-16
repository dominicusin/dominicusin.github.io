#!/usr/bin/env node
/**
 * build-crosslinks.cjs — GSD execution for initiative `cross-links`.
 *
 * Derives repository ↔ repository "related" links from shared `language` and/or
 * shared `topics` (case-insensitive). Writes data/crosslinks.json (gitignored,
 * regenerated each build). Graceful: absent data/github.json → empty graph.
 *
 * Pivot note (BMAD decision #6): post↔repo had no signal in the data (0 matches
 * by tag, substring, or in-body mentions of own repos); repo↔repo is richly
 * supported and is what we ship.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GH = path.join(ROOT, 'data', 'github.json');
const OUT = path.join(ROOT, 'data', 'crosslinks.json');

function main() {
  const repos = [];
  if (fs.existsSync(GH)) {
    try { repos.push(...JSON.parse(fs.readFileSync(GH, 'utf8')).repos || []); }
    catch (e) { console.warn('⚠ bad data/github.json:', e.message); }
  }
  if (!repos.length) {
    console.warn('⚠ no repos in data/github.json — emitting empty cross-links (graceful).');
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ repos: {} }, null, 2) + '\n');
    return;
  }

  const norm = s => (s || '').toLowerCase().trim();
  const nodes = repos.map(r => ({
    fullName: r.fullName,
    lang: norm(r.language),
    topics: (r.topics || []).map(norm).filter(Boolean),
    url: '/repositories/' + r.fullName.replace('/', '__') + '/',
  }));

  const out = { repos: {} };
  for (const a of nodes) {
    const related = [];
    const byLang = [];
    const byTopic = [];
    for (const b of nodes) {
      if (a.fullName === b.fullName) continue;
      const sameLang = a.lang && a.lang === b.lang;
      const shared = a.topics.filter(t => b.topics.includes(t));
      if (sameLang || shared.length) {
        related.push(b.fullName);
        if (sameLang) byLang.push(b.fullName);
        if (shared.length) byTopic.push(b.fullName);
      }
    }
    if (related.length) {
      out.repos[a.fullName] = { url: a.url, related, byLanguage: byLang, byTopic };
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  const linked = Object.keys(out.repos).length;
  console.log(`✅ cross-links: ${linked}/${nodes.length} repos have related repos → ${path.relative(ROOT, OUT)}`);
}

main();
