# Spec — Show human names (not hash IDs) on /gists/

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/gist-names.md`.

## Context
`/gists/` cards (and the single-gist page title) render `gist_id` — a 32-char hash
(e.g. `21432fc5f29c73591044eafa09e6fafc`). Unreadable. The user wants the human
name. For gist `21432…`: `description='zroot'`, `files=['zroot']` → should show
**"zroot zroot"**.

## Requirements
- **R1** `scripts/sync-github.cjs writeGistPage` emits a new `gist_name` frontmatter
  field = `(description ? description + ' ' : '') + firstFileName`; if no files,
  `description || gist.id`.
- **R2** `layouts/gists/list.html` shows `{{ .Params.gist_name }}` as the card name
  (replaces `{{ .Params.gist_id }}`). URL stays `<id>` (no slug change).
- **R3** `layouts/gists/single.html` shows `gist_name` (page header), not the hash.
- **R4** Regenerate `content/gists/*.md`, rebuild; verify the example gist card reads
  "zroot zroot" and the list shows names not hashes.
- **R5** Safety: `hugo` 0 errors; lint clean; test pass; check-links 0 broken;
  check-perf 0 regressions.

## Acceptance (measurable)
- `grep` built `public/gists/index.html` for `zroot zroot` → present; `21432fc…`
  appears only in `href` (URL), NOT as visible card text.
- `node scripts/check-perf.cjs` exits 0.

## Out of scope
- URL slug change; ontology/taxonomy expansion.
