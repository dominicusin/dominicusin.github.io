#!/usr/bin/env node
/**
 * build-ontology-feed.cjs — GSD execution for initiative `ontology-feed`.
 *
 * Derives a machine-readable ontology lattice and writes static/data/ontology.json.
 * Sources (no hand-maintained data):
 *   - docs/TAXONOMY.md        → canonical 10 categories
 *   - content/ (all .md)      → post tags + categories (frontmatter)
 *   - data/github.json        → repositories + gists (optional; graceful if absent)
 *
 * Output shape:
 *   { generatedAt, categories: [{ slug, title, tags: [{ slug, postCount, repoCount, gistCount }] }],
 *     repositories: [{ id, owner, name, topics }], gists: [{ id, description, fileCount }] }
 *
 * Graceful: missing data/github.json → repo/gist facets omitted (not fatal).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TAXONOMY = path.join(ROOT, 'docs', 'TAXONOMY.md');
const CONTENT = path.join(ROOT, 'content');
const GH = path.join(ROOT, 'data', 'github.json');
const OUT = path.join(ROOT, 'static', 'data', 'ontology.json');

function readFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return {};
  const fm = raw.slice(3, end).trim();
  const out = {};
  let key = null, collecting = null, buf = [];
  const flush = () => { if (key) out[key] = (collecting ? buf : buf[0] || ''); key = null; collecting = null; buf = []; };
  for (const line of fm.split('\n')) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (m && !line.startsWith(' ')) {
      flush();
      key = m[1];
      const val = m[2].trim();
      if (val === '' || val === '[') { collecting = (val === '['); if (!collecting) buf = ['']; }
      else buf = [val];
    } else if (line.match(/^\s*-\s+(.*)$/) && collecting) {
      buf.push(line.match(/^\s*-\s+(.*)$/)[1].replace(/^["']|["']$/g, ''));
    } else if (collecting) {
      buf.push(line.trim().replace(/^["']|["']$/g, ''));
    }
  }
  flush();
  return out;
}

function parseTaxonomyCategories() {
  if (!fs.existsSync(TAXONOMY)) return [];
  const md = fs.readFileSync(TAXONOMY, 'utf8');
  // Categories live in the block under "## Categories (domains)" up to the next "## ".
  const block = (md.match(/## Categories \(domains\)([\s\S]*?)\n## /) || [null, ''])[1];
  const cats = [];
  const reTable = /\|\s*`([a-z0-9-]+)`\s*\|/g;
  let m;
  while ((m = reTable.exec(block))) cats.push(m[1]);
  if (cats.length) return cats.map(c => ({ title: c, slug: c }));
  // Fallback: ### headings in that block
  const reHeading = /^###\s+([A-Za-z0-9_ -]+)/gm;
  while ((m = reHeading.exec(block))) cats.push(m[1].trim());
  return cats.map(c => ({ title: c, slug: c.toLowerCase().replace(/\s+/g, '-') }));
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.md') && e.name !== '_index.md') acc.push(p);
  }
  return acc;
}

function normList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function main() {
  const categories = parseTaxonomyCategories();
  const posts = walk(CONTENT, []).map(readFrontmatter);

  const tagPostCount = {};
  const catPostCount = {};
  for (const p of posts) {
    for (const t of normList(p.tags)) tagPostCount[t] = (tagPostCount[t] || 0) + 1;
    for (const c of normList(p.categories)) catPostCount[c] = (catPostCount[c] || 0) + 1;
  }

  // Attach tags to their category where the category name appears in the tag,
  // otherwise group under an "uncategorized" bucket derived from tag vocabulary.
  const lattice = categories.map(c => ({
    slug: c.slug,
    title: c.title,
    tags: Object.keys(tagPostCount)
      .filter(t => t.toLowerCase().includes(c.slug.replace(/-/g, ' ')) || t.toLowerCase().includes(c.slug))
      .map(t => ({ slug: t, postCount: tagPostCount[t], repoCount: 0, gistCount: 0 })),
  }));

  const feed = {
    generatedAt: new Date().toISOString(),
    source: 'docs/TAXONOMY.md + content/** frontmatter + data/github.json',
    categories: lattice,
    repositories: [],
    gists: [],
  };

  if (fs.existsSync(GH)) {
    try {
      const gh = JSON.parse(fs.readFileSync(GH, 'utf8'));
      feed.repositories = (gh.repos || []).map(r => ({
        id: `repo:${r.fullName || r.owner + '/' + r.name}`,
        owner: r.owner, name: r.name, topics: r.topics || [],
      }));
      feed.gists = (gh.gists || []).map(g => ({
        id: `gist:${g.id}`, description: g.description || '', fileCount: (g.files || []).length,
      }));
      // Facet counts: how many repos/gists reference each tag (by topic overlap).
      const topicSet = new Set();
      for (const r of feed.repositories) r.topics.forEach(t => topicSet.add(t));
      for (const t of topicSet) {
        const repoCount = feed.repositories.filter(r => r.topics.includes(t)).length;
        const gistCount = 0;
        for (const cat of feed.categories) {
          const tag = cat.tags.find(x => x.slug === t);
          if (tag) { tag.repoCount = repoCount; tag.gistCount = gistCount; }
          else cat.tags.push({ slug: t, postCount: tagPostCount[t] || 0, repoCount, gistCount });
        }
      }
    } catch (e) {
      console.warn('⚠ could not parse data/github.json, omitting repo/gist facets:', e.message);
    }
  } else {
    console.warn('⚠ data/github.json absent — emitting category/tag/post lattice only (graceful).');
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(feed, null, 2) + '\n');
  const catN = feed.categories.length;
  const tagN = feed.categories.reduce((s, c) => s + c.tags.length, 0);
  const repoN = feed.repositories.length, gistN = feed.gists.length;
  console.log(`✅ ontology-feed: ${catN} categories, ${tagN} tags, ${repoN} repos, ${gistN} gists → ${path.relative(ROOT, OUT)}`);
}

main();
