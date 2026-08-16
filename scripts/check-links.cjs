#!/usr/bin/env node
/**
 * @fileoverview Internal broken-link checker for the built Hugo site.
 *
 * Crawls ./public, collects same-origin hrefs, and verifies each target exists
 * as a file or a directory with index.html. Exits 1 if any internal link is
 * broken. External (http(s)://other-host) and in-page (#hash) links are skipped.
 *
 * This is the concrete "broken link check" from the CI/CD automation stage. It
 * runs after `hugo --minify` in the quality workflow, so it validates the
 * ACTUAL published surface, not source markdown.
 *
 * Usage: node scripts/check-links.cjs [publicDir] [baseURL]
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = process.argv[2] || path.join(__dirname, '..', 'public');
const BASE = process.argv[3] || 'https://dominicusin.github.io';

if (!fs.existsSync(PUBLIC)) {
  console.error(`✗ public/ not found at ${PUBLIC}. Run hugo build first.`);
  process.exit(1);
}

const httpRe = /^https?:\/\//;
// Only match hrefs that look like real URLs (no JS-template artifacts like
// '+t+' or backticks). Links inside <script>/<style> are stripped below.
const hrefRe = /href="([^"]+)"/g;
const cleanRe = /href="([^"'+`<>]+)"/g;

// Map a resolved URL path to a file inside public/.
function targetExists(urlPath) {
  // Strip query/hash.
  let p = urlPath.split('#')[0].split('?')[0];
  if (p.endsWith('/')) p += 'index.html';
  if (!p.endsWith('.html') && !p.endsWith('.xml') && !p.includes('.')) p += '/index.html';
  const abs = path.join(PUBLIC, p);
  return fs.existsSync(abs);
}

function collectFromFile(file, found) {
  let html = fs.readFileSync(file, 'utf8');
  // Strip <script> and <style> blocks — they contain JS/strings that are not
  // real navigable links (e.g. '/post/'+t+' would be falsely extracted).
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  let m;
  while ((m = cleanRe.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('javascript:')) continue;
    if (httpRe.test(href) && !href.startsWith(BASE)) continue;
    if (href.startsWith(BASE)) {
      found.add(href.slice(BASE.length) || '/');
    } else if (href.startsWith('/')) {
      found.add(href);
    } else if (!httpRe.test(href)) {
      // relative link — resolve against the current file's directory
      const rel = path.relative(PUBLIC, path.dirname(file));
      found.add(path.posix.join('/' + rel.replace(/\\/g, '/'), href));
    }
  }
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html') || entry.name.endsWith('.xml')) out.push(full);
  }
}

const files = [];
walk(PUBLIC, files);
const links = new Set();
for (const f of files) collectFromFile(f, links);

const broken = [];
for (const l of links) {
  if (!targetExists(l)) broken.push(l);
}

console.log(`🔗 Checked ${links.size} unique internal links across ${files.length} pages.`);
if (broken.length === 0) {
  console.log('✅ No broken internal links.');
  process.exit(0);
}
console.error(`\n❌ ${broken.length} broken internal link(s):`);
broken.slice(0, 30).forEach(b => console.error('   - ' + b));
process.exit(1);
