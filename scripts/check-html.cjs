#!/usr/bin/env node
/**
 * @fileoverview Lightweight HTML well-formedness / a11y spot-check for the
 * built site. Intentionally NON-BLOCKING (the quality workflow runs it with
 * continue-on-error). A full HTML5 validator is heavy and noisy on theme
 * markup; this catches the cheap, high-value issues:
 *   - <img> without alt attribute (a11y)
 *   - unbalanced <html>/<head>/<body> tags
 *
 * Usage: node scripts/check-html.cjs [publicDir]
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = process.argv[2] || path.join(__dirname, '..', 'public');

if (!fs.existsSync(PUBLIC)) {
  console.error(`✗ public/ not found at ${PUBLIC}. Run hugo build first.`);
  process.exit(1);
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
}

const files = [];
walk(PUBLIC, files);
let warnings = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(PUBLIC, f);
  // <img> without alt
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of imgs) {
    if (!/\salt=/.test(tag)) {
      console.warn(`⚠ ${rel}: <img> missing alt attribute`);
      warnings++;
    }
  }
  // tag balance for structural elements
  for (const t of ['html', 'head', 'body']) {
    const open = (html.match(new RegExp(`<${t}[\\s>]`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${t}>`, 'g')) || []).length;
    if (open !== close) {
      console.warn(`⚠ ${rel}: <${t}> tag imbalance (open=${open} close=${close})`);
      warnings++;
    }
  }
}

console.log(`🩺 HTML check: ${files.length} pages, ${warnings} warning(s).`);
if (warnings > 0) {
  console.log('   (report-only — non-blocking in CI)');
}
process.exit(0);
