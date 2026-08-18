# Spec — Related posts (blog navigation by shared tags)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/related-posts.md`.

## Requirements
- **R1** Blog single pages render a "Похожие статьи" section listing posts that
  share tags with the current post, via the Blowfish `related.html` partial
  (theme-native; enabled by config, not new code).
- **R2** The related index is configured in `hugo.toml` `[related]` with
  `indices` on `tags` (weight 100) and `categories` (weight 50), so ranking
  prefers shared tags.
- **R3** `params.article.relatedContentLimit` is set to a positive integer (5) so
  the partial emits up to N related posts.
- **R4** Graceful: a post with no shared-tag neighbours renders no section (no
  empty heading, no error).
- **R5** Link targets are valid post permalinks (no broken internal links).

## Acceptance contract
- `hugo --gc --minify` exits 0; ≥1 blog post page shows a related-posts section
  with real links to other posts.
- `node scripts/check-links.cjs` reports 0 broken internal links.
- No new script/partial introduced (theme-native machinery only) — verified by
  `git diff` containing only config changes + task artifacts.

## Out of scope
- Custom related algorithm.
- Post↔repo linking.
