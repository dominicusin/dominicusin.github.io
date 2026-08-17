/**
 * check-og-image.cjs
 * Guard: every published BLOG POST page must render a social `og:image`
 * (either explicit frontmatter `image` or the site defaultSocialImage fallback).
 * Post pages live at public/<year>/<month>/<day>/<slug>/index.html (dated paths).
 * List/taxonomy pages (categories/*, tags/*, *\/page/*, blog/page/*) are excluded.
 * Exits non-zero if any post page lacks og:image — catches fallback-regression.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PUBLIC = path.join(__dirname, '..', 'public');
if (!fs.existsSync(PUBLIC)) {
  console.error('public/ not built — run `hugo` first.');
  process.exit(1);
}

const postPages = glob.sync('public/[0-9][0-9][0-9][0-9]/**/index.html');
let missing = 0;
for (const f of postPages) {
  const c = fs.readFileSync(f, 'utf-8');
  if (!/property="og:image"/.test(c)) {
    missing++;
    console.error('  MISSING og:image:', f);
  }
}
if (missing > 0) {
  console.error(`\n❌ ${missing} post page(s) without og:image.`);
  process.exit(1);
}
console.log(`✅ All ${postPages.length} post pages have og:image.`);
