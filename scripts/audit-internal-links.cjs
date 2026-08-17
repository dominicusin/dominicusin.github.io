/**
 * audit-internal-links.cjs
 * Local (no network) auditor for internal links in content/ markdown.
 * Classifies each markdown link target as:
 *   - PROTOCOL   : non-http URI scheme (stun:, tel:, etc.) — not a file link
 *   - PROSE/BARE : captured from prose/bare URL text — false positive
 *   - EXTERNAL   : http(s) / mailto: — checked elsewhere (not here)
 *   - ROOT_OK    : starts with / and the asset exists on disk at .<path>
 *   - REL_OK     : relative path that resolves to an existing file
 *   - REL_FIXABLE: relative path missing locally but a repo-root file exists
 *   - BROKEN     : relative path missing and no repo-root equivalent
 * Only BROKEN + REL_FIXABLE are actionable dead links (no false positives).
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const REPO_ROOT = path.join(__dirname, '..');
const rootFiles = new Set(fs.readdirSync(REPO_ROOT));

// Auto-generated / CI-fallback content must NOT be edited (regenerated each sync).
const IGNORE = ['content/gists/**'];

const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
const mdFiles = glob.sync('**/*.md', { cwd: CONTENT_DIR, absolute: true, ignore: IGNORE });

function classify(file, target) {
  const t = target.trim();
  // Regex-literal false positives (e.g. `.+`, `.+?` captured from code in gist pages)
  if (/^\.\+\??$/.test(t)) return 'REGEX_LITERAL';
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return 'PROTOCOL';
  if (/\s/.test(t)) return 'PROSE/BARE';
  if (t.startsWith('http') || t.startsWith('#') || t.startsWith('mailto:')) return 'EXTERNAL';
  if (t.startsWith('/')) {
    return fs.existsSync(path.join(REPO_ROOT, t)) ? 'ROOT_OK' : 'ROOT_MISSING';
  }
  const rel = path.resolve(path.dirname(file), t);
  if (fs.existsSync(rel)) return 'REL_OK';
  const base = t.replace(/^\.\//, '');
  if (rootFiles.has(base)) return 'REL_FIXABLE';
  return 'BROKEN';
}

const counts = {};
const actionable = [];
for (const file of mdFiles) {
  const text = fs.readFileSync(file, 'utf-8');
  let m;
  while ((m = linkRe.exec(text))) {
    const k = classify(file, m[1]);
    counts[k] = (counts[k] || 0) + 1;
    if (k === 'BROKEN' || k === 'REL_FIXABLE') {
      actionable.push({ file: path.relative(REPO_ROOT, file), target: m[1], kind: k });
    }
  }
}

console.log('=== Internal-link classification (content/**, excl. generated gists) ===');
for (const [k, v] of Object.entries(counts).sort()) {
  console.log(`  ${k.padEnd(14)} ${v}`);
}
console.log(`\n=== Actionable dead links: ${actionable.length} ===`);
for (const a of actionable) {
  console.log(`  [${a.kind}] ${a.file}  ->  ${a.target}`);
}
module.exports = { classify, mdFiles };
