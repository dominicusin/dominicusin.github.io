/**
 * sanitize-generated.cjs — one-pass sanitizer for ALREADY-GENERATED content.
 *
 * TASK-009 added sanitizeExternal() inside scripts/sync-github.cjs so that
 * freshly-synced GitHub READMEs/gists are stripped of executable vectors
 * (<script>, inline on*= handlers, javascript:/vbscript: link schemes,
 * <iframe>/<object>/<embed>, plus pads missing <img> alt) before they are
 * written into content/.
 *
 * Gap this script closes: if a sync is skipped (rate-limit / cache / partial
 * run), previously-written generated content is never re-sanitized. This
 * script re-runs the SAME sanitizer (imported from scripts/sanitize.cjs, the
 * single source of truth) over every existing generated file so a stored-XSS
 * payload cannot survive a deploy untouched. Run in the Pages deploy workflow
 * immediately before `hugo build`.
 *
 * Defense-in-depth, NOT a full HTML sanitizer — legitimate code blocks
 * (e.g. `<a>` inside fenced blocks, `a < b && c > d`) are preserved.
 */

const fs = require('fs');
const path = require('path');
const { sanitizeExternal } = require('./sanitize.cjs');

const TARGETS = [
  path.join('content', 'repositories'),
  path.join('content', 'gists'),
];

let scanned = 0;
let changed = 0;

for (const dir of TARGETS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(dir, file);
    const before = fs.readFileSync(full, 'utf8');
    const after = sanitizeExternal(before);
    if (before !== after) {
      fs.writeFileSync(full, after);
      changed++;
      console.log(`  sanitized ${full}`);
    }
    scanned++;
  }
}

console.log(`🔒 sanitize-generated: scanned ${scanned} generated file(s), sanitized ${changed}.`);
process.exit(0);
