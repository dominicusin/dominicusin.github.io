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
const yaml = require('js-yaml');

const ROOT = process.cwd();
const TAXONOMY = path.join(ROOT, 'docs', 'TAXONOMY.md');
const CONTENT = path.join(ROOT, 'content');
const GH = path.join(ROOT, 'data', 'github.json');
const OUT = path.join(ROOT, 'static', 'data', 'ontology.json');

function readFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---(?:\s|$)/);
  if (!match) return {};
  try { return yaml.load(match[1]) || {}; }
  catch (error) { console.warn(`⚠ could not parse frontmatter in ${file}: ${error.message}`); return {}; }
}

function parseTaxonomyCategories() {
  if (!fs.existsSync(TAXONOMY)) return [];
  const md = fs.readFileSync(TAXONOMY, 'utf8');
  // Categories live in the block under "## Categories (domains)" up to the next "## ".
  const block = (md.match(/## Categories \(domains\)([\s\S]*?)\n## /) || [null, ''])[1];
  const cats = [];
  const reTable = /\|\s*`([a-z0-9-]+)`\s*\|\s*([^|]+)\s*\|/g;
  let m;
  while ((m = reTable.exec(block))) cats.push({ slug: m[1], title: m[2].trim() });
  if (cats.length) return cats;
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
  const tagsByCategory = {};
  for (const p of posts) {
    const tags = normList(p.tags);
    const pageCategories = normList(p.categories);
    for (const t of tags) tagPostCount[t] = (tagPostCount[t] || 0) + 1;
    for (const c of pageCategories) {
      const key = String(c).toLowerCase();
      tagsByCategory[key] = tagsByCategory[key] || new Set();
      tags.forEach(t => tagsByCategory[key].add(t));
    }
  }

  const lattice = categories.map(c => ({
    slug: c.slug,
    title: c.title,
    tags: [...(tagsByCategory[c.slug.toLowerCase()] || new Set())]
      .map(t => ({ slug: t, postCount: tagPostCount[t], repoCount: 0, gistCount: 0 })),
  }));

  const feed = {
    generatedAt: new Date().toISOString(),
    source: 'docs/TAXONOMY.md + content/** frontmatter + data/github.json',
    categories: lattice,
    repositories: [],
    gists: [],
    repositoryTopics: [],
  };

  if (fs.existsSync(GH)) {
    try {
      const gh = JSON.parse(fs.readFileSync(GH, 'utf8'));
      feed.repositories = (gh.repos || []).map(r => ({
        id: `repo:${r.fullName || r.owner + '/' + r.name}`,
        owner: r.owner, name: r.name, url: r.html_url || `https://github.com/${r.owner}/${r.name}`, topics: r.topics || [],
      }));
      feed.gists = (gh.gists || []).map(g => ({
        id: `gist:${g.id}`, description: g.description || '', url: g.html_url || `https://gist.github.com/${g.id}`, fileCount: (g.files || []).length,
      }));
      // Facet counts: how many repos/gists reference each tag (by topic overlap).
      const topicCounts = new Map();
      for (const r of feed.repositories) for (const t of r.topics) topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      feed.repositoryTopics = [...topicCounts.entries()].map(([slug, repoCount]) => ({ slug, repoCount })).sort((a, b) => b.repoCount - a.repoCount || a.slug.localeCompare(b.slug));
      for (const { slug: t, repoCount } of feed.repositoryTopics) {
        for (const cat of feed.categories) {
          const tag = cat.tags.find(x => x.slug === t);
          if (tag) tag.repoCount = repoCount;
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
