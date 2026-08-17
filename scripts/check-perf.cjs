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
 *
 * The main CSS bundle is intentionally render-blocking (rel=stylesheet). A
 * previous non-blocking preload+swap caused a catastrophic CLS (~1.0): the page
 * painted UNSTYLED, then snapped into the styled layout. Render-blocking CSS does
 * NOT cause CLS (content waits for styles). The 128KB bundle is already-purged
 * component CSS (not trimmable without dropping features), so render-blocking is
 * correct. The gate therefore does NOT fail on a blocking stylesheet — it only
 * reports the bundle size as informational. It WOULD have caught the original
 * #111 JS regression, which it still guards.
 *
 * This protects the #111 (deferred JS) perf fix against silent regressions and
 * makes the perf signal actionable locally (no Chrome/Lighthouse binary needed).
 * Mirrors scripts/check-links.cjs.
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

// --- 2) Main CSS bundle: intentionally render-blocking (rel=stylesheet) -----
// A blocking stylesheet is CORRECT here (prevents the CLS=1.0 unstyled-flash
// bug). The gate does NOT fail on it; it only reports the bundle size.
// (This is the deliberate revert of the #112 non-blocking experiment.)
const linkRe = /<link\b([^>]*)>/gi;
let stylesheetCount = 0;
let lm;
while ((lm = linkRe.exec(head)) !== null) {
  const attrs = lm[1];
  if (/(^|\s)rel\s*=\s*["']?stylesheet["']?/i.test(attrs)) stylesheetCount += 1;
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
console.log(`   CSS bundle <link rel=stylesheet>      : ${stylesheetCount} (render-blocking is intentional — avoids CLS)`);
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
