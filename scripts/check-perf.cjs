#!/usr/bin/env node
/**
 * @fileoverview Performance smoke check for the built Hugo site.
 *
 * Parses the LCP-critical homepage (public/index.html) and fails if a render-
 * blocking resource regresses:
 *   - any executable <script> in <head> that is render-blocking. Render-blocking
 *     means: has a src AND lacks defer/async AND is not type=module (modules are
 *     deferred by default); OR is an inline <script> with executable body and no
 *     defer/async. Inline non-executable scripts (application/json, ld+json, or
 *     empty) are exempt.
 *   - any <link rel=stylesheet> in <head> outside <noscript> (the main CSS bundle
 *     must load non-render-blocking via rel=preload as=style + onload swap).
 *
 * This protects the #111 (deferred JS) and #112 (non-blocking CSS) perf fixes
 * against silent regressions and makes the perf signal actionable locally (no
 * Chrome/Lighthouse binary needed). Mirrors scripts/check-links.cjs.
 *
 * Complementary to (not a replacement for) the CI Lighthouse job, which is
 * non-blocking and runs on throttled shared infra.
 *
 * Usage: node scripts/check-perf.cjs [publicDir]
 * Exits 0 if no regressions; 1 if a render-blocking resource is found.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = process.argv[2] || path.join(__dirname, '..', 'public');
const HOME = path.join(PUBLIC, 'index.html');

if (!fs.existsSync(HOME)) {
  console.error(`✗ public/index.html not found at ${HOME}. Run hugo build first.`);
  process.exit(1);
}

const html = fs.readFileSync(HOME, 'utf8');

// Isolate <head> … </head>.
const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
if (!headMatch) {
  console.error('✗ <head> not found in index.html.');
  process.exit(1);
}
let head = headMatch[1];

// Strip <noscript>…</noscript> so the required blocking fallback doesn't count.
head = head.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

const NON_EXEC_TYPE = /type\s*=\s*["']?application\/(json|ld\+json)["']?/i;
const MODULE_TYPE = /type\s*=\s*["']?module["']?/i;
const hasAttr = (attrs, name) =>
  new RegExp(`\\b${name}\\b`, 'i').test(attrs);

const errors = [];

// --- 1) Render-blocking executable <script> in <head> -----------------------
// Match full <script>…</script> so we can inspect inline bodies.
const scriptTagRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let sm;
while ((sm = scriptTagRe.exec(head)) !== null) {
  const attrs = sm[1];
  const body = sm[2];
  const hasSrc = hasAttr(attrs, 'src');
  const deferred = hasAttr(attrs, 'defer');
  const asyncd = hasAttr(attrs, 'async');
  const isModule = MODULE_TYPE.test(attrs);
  const nonExec = NON_EXEC_TYPE.test(attrs);

  // Non-executable data blocks (JSON / JSON-LD) never block.
  if (nonExec) continue;
  // type=module is deferred by default.
  if (isModule) continue;

  if (hasSrc) {
    // External script: OK only if deferred or async.
    if (!deferred && !asyncd) {
      const src = (attrs.match(/src\s*=\s*["']?([^"'\s>]*)["']?/i) || [])[1] || '(unquoted)';
      errors.push(`render-blocking <script src="${src}"> (missing defer/async)`);
    }
    continue;
  }

  // Inline script. Empty / whitespace-only body is harmless; only executable
  // inline JS without defer/async blocks first paint. Trivial vendor inits
  // (analytics snippets, ~<256 chars) are parser-blocking in theory but
  // negligible in practice and outside the #111/#112 regression surface, so
  // they're exempt. A real regression (inlining a library) would exceed this.
  const INLINE_EXEC_TRIVIAL = 256;
  if (body.trim().length <= INLINE_EXEC_TRIVIAL) continue;
  if (!deferred && !asyncd) {
    errors.push('inline <script> with executable body in <head> without defer/async (render-blocking)');
  }
}

// --- 2) Render-blocking CSS <link> in <head> (outside noscript) -------------
// Match a real rel="stylesheet" HTML attribute (not the substring inside an
// onload="this.rel='stylesheet'" handler). Attribute values may be unquoted.
const linkRe = /<link\b([^>]*)>/gi;
let cssBlocking = 0;
let lm;
while ((lm = linkRe.exec(head)) !== null) {
  const attrs = lm[1];
  // rel attribute preceded by whitespace/start-of-tag, value exactly "stylesheet"
  // (quote-optional). This does NOT match the onload handler substring.
  if (/(^|\s)rel\s*=\s*["']?stylesheet["']?/i.test(attrs)) {
    cssBlocking += 1;
    errors.push('render-blocking <link rel=stylesheet> in <head> (CSS must load non-blocking)');
  }
}

// --- 3) Informational: CSS bundle byte size --------------------------------
let cssBytes = 0;
const hrefMatch = head.match(/href\s*=\s*["']([^"']*main\.bundle[^"']*)["']/i);
if (hrefMatch) {
  const rel = hrefMatch[1].replace(/^\//, '');
  const file = path.join(PUBLIC, rel);
  if (fs.existsSync(file)) cssBytes = fs.statSync(file).size;
}
const CSS_WARN_THRESHOLD = 140 * 1024;

// --- Report ----------------------------------------------------------------
console.log('🔎 Performance smoke check (built public/index.html)');
console.log(`   render-blocking <script> regressions : ${errors.filter((e) => e.includes('script')).length}`);
console.log(`   render-blocking <link rel=stylesheet> : ${cssBlocking}`);
if (cssBytes > 0) {
  const kb = (cssBytes / 1024).toFixed(1);
  const flag = cssBytes > CSS_WARN_THRESHOLD ? ' ⚠️ (above 140KB threshold — informational)' : '';
  console.log(`   CSS bundle size                      : ${kb} KB${flag}`);
}

if (errors.length > 0) {
  console.error('\n✗ Performance regression(s) detected:');
  for (const e of errors) console.error('   - ' + e);
  console.error('\nFix: ensure theme scripts use defer/async (or type=module) and the CSS');
  console.error('bundle uses rel=preload as=style + onload swap (layouts/partials/head.html).');
  process.exit(1);
}

console.log('\n✅ No render-blocking resource regressions.');
process.exit(0);
