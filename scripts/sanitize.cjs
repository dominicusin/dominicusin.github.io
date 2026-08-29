/**
 * sanitize.cjs - shared trust-boundary sanitizer for EXTERNAL/auto-ingested
 * content (GitHub READMEs, gists) written into content/repositories/* and
 * content/gists/* by scripts/sync-github.cjs.
 *
 * Hugo runs with `unsafe = true`, so any executable vector (or a11y gap)
 * in ingested markdown is published as-is. This strips obvious stored-XSS
 * surfaces and pads missing `alt` on <img> so generated pages do not trip
 * the (non-blocking) a11y spot-check.
 *
 * Basic mitigation, NOT a full sanitizer - legitimate code blocks are
 * preserved. Render-time defense-in-depth lives in render-link.html.
 * Single source of truth for sync-github.cjs + sanitize-generated.cjs.
 */

function sanitizeExternal(input) {
  if (!input) return input;
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi, '')
    // neutralize javascript:/vbscript: link schemes in raw markdown links
    .replace(/[(]javascript:[^)\s]*[)]/gi, '(#)')
    .replace(/[(]vbscript:[^)\s]*[)]/gi, '(#)')
    .replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/(iframe|object|embed)>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*\/?>/gi, '')
    // a11y: <img> without alt gets an empty alt (decorative/technical images
    // from ingested gists/repos should not fail the a11y spot-check)
    .replace(/<img\b([^>]*?)\b(?!alt=)([^>]*)>/gi, '<img alt="$1$2>')
    // link-rot: GitHub READMEs link to /tags/<x>/, /domini/, /people/ etc.
    // that do not exist on this site. Neutralize those internal markdown
    // links (keep the visible label, drop the broken href) so generated
    // pages don't publish dead internal links.
    .replace(/\[([^\]]+)\]\(((\/tags\/|\/domini\/|\/people\/)[^)\s]+)\)/gi, '$1');
}

module.exports = { sanitizeExternal };
