#!/usr/bin/env node
/**
 * migrate-jekyll-to-hugo.cjs
 * Variant A SSG migration — Phase 2.
 * Migrates _posts/*.markdown -> content/posts/*.md with normalized Hugo
 * frontmatter, preserving the legacy Jekyll permalink via `aliases`.
 *
 * Usage: node scripts/migrate-jekyll-to-hugo.cjs
 * Idempotent: re-running overwrites content/posts with fresh output.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, '_posts');
const OUT_DIR = path.join(ROOT, 'content', 'posts');

// Fields we deliberately drop (Jekyll-only / layout hints Hugo ignores).
const DROP_KEYS = new Set(['layout', 'permalink', 'published', 'excerpt_separator']);
// Known Hugo/standard keys we keep.
const KEEP_KEYS = new Set([
  'title', 'date', 'draft', 'slug', 'summary', 'description', 'categories',
  'tags', 'authors', 'weight', 'aliases', 'url', 'image', 'toc', 'math',
]);

function normalizeDate(d) {
  // Jekyll date like "2015-11-19 03:41:00 +02:00" -> ISO 8601.
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') {
    const s = d.trim().replace(' ', 'T');
    const dt = new Date(s);
    if (!isNaN(dt)) return dt.toISOString();
  }
  return null;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  let data = {};
  try { data = yaml.load(m[1]) || {}; } catch (e) { data = {}; }
  const body = raw.slice(m[0].length);
  return { data, body };
}

function migrateFile(file) {
  const full = path.join(SRC_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, body } = parseFrontmatter(raw);

  // Filename: YYYY-MM-DD-slug.markdown
  const base = path.basename(file, path.extname(file));
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!m) {
    console.warn(`  SKIP (no date in filename): ${file}`);
    return null;
  }
  const [, y, mo, d, slug] = m;

  const out = {};
  out.title = (data.title || slug).toString().trim();
  const iso = normalizeDate(data.date) || `${y}-${mo}-${d}T00:00:00Z`;
  out.date = iso;
  out.slug = slug;
  // Preserve legacy permalink for SEO/back-compat.
  out.aliases = [`/${y}/${mo}/${d}/${slug}.html`];

  if (Array.isArray(data.categories)) out.categories = data.categories;
  if (Array.isArray(data.tags)) out.tags = data.tags;
  if (data.summary || data.description) out.summary = (data.summary || data.description).toString().trim();
  if (data.authors) out.authors = data.authors;
  if (typeof data.draft === 'boolean') out.draft = data.draft;

  // Carry over any custom keys not in DROP, as Hugo params (kept for content-contract compatibility).
  for (const [k, v] of Object.entries(data)) {
    if (DROP_KEYS.has(k) || KEEP_KEYS.has(k) || k in out) continue;
    if (k === 'field_name') out.params = out.params || {};
    out[k] = v;
  }

  const fm = yaml.dump(out, { lineWidth: 1000, noRefs: true, quotingType: '"' });
  const content = `---\n${fm}---\n${body.replace(/^\r?\n/, '')}`;

  const outFile = path.join(OUT_DIR, `${base}.md`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outFile, content, 'utf8');
  return outFile;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) { console.error('No _posts/ dir'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter(f => /\.markdown?$/.test(f));
  console.log(`Migrating ${files.length} posts from _posts/ -> content/posts/`);
  let ok = 0, skip = 0;
  for (const f of files) {
    const r = migrateFile(f);
    if (r) ok++; else skip++;
  }
  console.log(`Done. ${ok} migrated, ${skip} skipped.`);
}

main();
