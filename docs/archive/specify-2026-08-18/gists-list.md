# Spec — Fix empty /gists/ list (flat gist pages)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/gists-list.md`.

## Context
`/gists/` renders the `gists-list` layout but lists 0 gists though `data/github.json`
has 100. `writeGistPage` wrote nested `content/gists/<id>/index.md`; the list
template ranges `.RegularPages`, which does not surface nested leaf bundles as
section pages. Flat `content/gists/<id>.md` (like repos) fixes it.

## Requirements
- **R1** `writeGistPage` writes flat `content/gists/<id>.md` (single file, direct
  child of the `gists` section), preserving frontmatter keys `type: gist`,
  `gist_id`, `gist_url`, `updated_at`, `files`.
- **R2** Stale nested `content/gists/<id>/` dirs are removed before regeneration so
  no duplicate/confusing pages remain.
- **R3** Built `/gists/` lists all generated gists (≥ 90; count matches data).
- **R4** Each gist `repo-card` shows `gist_id`, `description` (truncated), file count.
- **R5** Safety: `hugo` 0 errors; `npm run lint` clean; `npm run test` pass;
  `check-links` 0 broken; `check-perf` 0 regressions.

## Acceptance (measurable)
- `content/gists/*.md` count ≈ 100 (matches `data/github.json` gists length).
- Built `public/gists/index.html` contains ≥ 90 `repo-card` anchors.
- `curl`/built HTML `repo-card-name` shows gist ids.

## Out of scope
- Single gist page rendering; sync cadence; data source.
