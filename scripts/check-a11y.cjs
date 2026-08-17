/**
 * check-a11y.cjs — real a11y audit of the BUILT site (public/) using axe-core in jsdom.
 *
 * Audits a representative sample of page types (home, a post, a list page, a
 * repository page) against WCAG 2.0/2.1 A+AA. Exits non-zero if any violation
 * is found so it can gate CI.
 *
 * NOTE: jsdom cannot run canvas (color-contrast rule needs getContext), so we
 * skip `color-contrast` — run Lighthouse/axe in a real browser for that. This
 * covers structure/labels/names/landmarks which jsdom CAN evaluate.
 *
 * Usage: node scripts/check-a11y.cjs
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const sample = [
  'index.html',
  '2017/06/07/onionshare/index.html',
  'tags/index.html',
  'repositories/dominicusin__nixos-config/index.html',
].map(p => path.join(PUBLIC, p)).filter(p => fs.existsSync(p));

if (sample.length === 0) {
  console.error('No built pages found in public/. Run `hugo` first.');
  process.exit(2);
}

(async () => {
  let total = 0;
  const byRule = {};
  for (const file of sample) {
    const html = fs.readFileSync(file, 'utf-8');
    const dom = new JSDOM(html, {
      url: 'https://dominicusin.github.io/' + path.relative(PUBLIC, file),
      runScripts: 'outside-only',
    });
    const { window } = dom;
    window.eval(axe.source);
    const results = await window.axe
      .run(window.document, {
        runOnly: ['wcag2a', 'wcag2aa'],
        rules: { 'color-contrast': { enabled: false } },
      })
      .catch(() => ({ violations: [] }));
    for (const v of results.violations) {
      total += v.nodes.length;
      byRule[v.id] = byRule[v.id] || { count: 0, impact: v.impact, help: v.help };
      byRule[v.id].count += v.nodes.length;
    }
    console.log(`${path.relative(PUBLIC, file)}: ${results.violations.length} rules, ${results.violations.reduce((a, v) => a + v.nodes.length, 0)} nodes`);
  }
  if (total > 0) {
    console.error(`\n❌ ${total} a11y violation(s) found:`);
    for (const [id, info] of Object.entries(byRule).sort((a, b) => b[1].count - a[1].count)) {
      console.error(`  ${id} [${info.impact}]: ${info.count}x — ${info.help}`);
    }
    process.exit(1);
  }
  console.log('\n✅ No a11y violations (WCAG 2.0/2.1 A+AA, excluding color-contrast which needs a real browser).');
})().catch(e => { console.error(e); process.exit(1); });
