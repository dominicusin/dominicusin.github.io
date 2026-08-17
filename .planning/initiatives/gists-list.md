# BMAD — Initiative: `gists-list`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Self-identified initiative (user reported /gists/ empty despite >100 gists).
> Contract → Spec Kit. State → Beads. Execution → GSD.

## Why (reasoning)
User reported `/gists/` is empty though `data/github.json` has 100 gists. Verified
live: `dominicusin.github.io/gists/` renders the `gists-list` layout (repo-grid)
but contains **0 `repo-card` entries**. Root cause traced in code:
`writeGistPage` (scripts/sync-github.cjs) wrote gist pages as **nested**
`content/gists/<id>/index.md` (leaf bundles). The list template
(`layouts/gists/list.html`) iterates `{{ range .RegularPages.ByTitle }}` on the
`/gists/` section. Nested leaf bundles under `content/gists/<id>/` are NOT surfaced
as `.RegularPages` of the `gists` section the way **flat** pages are. By contrast
`writeRepoPage` writes **flat** `content/repositories/<owner>__<repo>.md`, and the
repo list works (user did not report /repositories/ empty). So the fix is to make
gist pages flat, mirroring the proven repo pattern.

## Shape (locked decisions)
1. **Change `writeGistPage` to flat layout**: write `content/gists/<id>.md` (single
   file, direct child of the `gists` section), exactly like `writeRepoPage`. Keep
   frontmatter keys (`type: gist`, `gist_id`, `gist_url`, `updated_at`, `files`)
   unchanged so `list.html`/single templates keep working.
2. **Clean before regenerate**: `content/gists/` (gitignored) must be cleared so no
   stale nested `<id>/index.md` dirs linger and create duplicate/confusing pages.
3. **No template change needed**: `layouts/gists/list.html` already ranges
   `.RegularPages` and reads `.Params.gist_id`/`.Params.description`/`.Params.files`.
   Flat pages make `.RegularPages` include them.
4. **Graceful & safe:** build 0 errors; lint/test/linkcheck/perf-gate stay green;
   no change to repo ingestion or data shape.

## Out of scope
- Per-gist page rendering fixes (single.html already exists and works once pages exist).
- Changing the gist data source or sync cadence.

## Handoff
- → Spec Kit `.specify/gists-list.md`.
- → Beads `.beads/beads.json`: T37–T40.
- → GSD `.gsd/plan.md`: Phase K execution + evidence.
