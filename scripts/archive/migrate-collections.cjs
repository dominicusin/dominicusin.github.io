#!/usr/bin/env node
/**
 * migrate-collections.cjs — Phase 3 (variant A).
 * Migrates _people/*.markdown -> content/people/*.md and
 * _domini/*.markdown -> content/domini/*.md as Hugo sections.
 * These are legacy/placeholder entries, so they are marked draft: true
 * for editorial cleanup before publication (per SSG plan, Phase 3).
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');

function conv(srcDir, outDir, kind) {
  if (!fs.existsSync(srcDir)) { console.log(`  (skip ${kind}: no ${srcDir})`); return; }
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter(f => /\.markdown?$/.test(f));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(srcDir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    let data = {};
    if (m) { try { data = yaml.load(m[1]) || {}; } catch (e) {} }
    const body = m ? raw.slice(m[0].length) : raw;
    const slug = path.basename(f, path.extname(f));
    let iso = '2021-01-01T00:00:00Z';
    if (data.date) {
      const dt = new Date(String(data.date).replace(' ', 'T'));
      if (!isNaN(dt)) iso = dt.toISOString();
    }
    const out = { title: (data.title || slug).toString().trim(), date: iso, slug, draft: true };
    if (data.layout) out.layout = data.layout;
    const fm = yaml.dump(out, { lineWidth: 1000, noRefs: true, quotingType: '"' });
    fs.writeFileSync(path.join(outDir, slug + '.md'), `---\n${fm}---\n${body.replace(/^\r?\n/, '')}`, 'utf8');
    console.log(`  ${kind}/${slug}.md`);
  }
}

conv('_people', 'content/people', 'people');
conv('_domini', 'content/domini', 'domini');
console.log('Phase 3 collections migrated (draft: true).');
