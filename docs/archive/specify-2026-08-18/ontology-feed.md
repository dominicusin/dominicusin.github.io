# Spec — Ontology Feed (`ontology-feed`)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance context: `.planning/initiatives/ontology-feed.md`.

## Requirements
- **R1** A machine-readable `static/data/ontology.json` is generated at build time
  (gitignored, regenerated every build — never hand-edited).
- **R2** The feed exposes a **lattice**: `categories[]` each with `tags[]`; each tag
  carries `postCount`, `repoCount`, `gistCount`; plus `repositories[]` and
  `gists[]` facetted by owner/category where known.
- **R3** Categories/tags are derived from the canonical source (docs/TAXONOMY.md
  10 categories + Hugo `tags`/`categories` taxonomies) — no new hand-maintained data.
- **R4** Repo/gist facets are sourced from `data/github.json` (output of
  `sync-github.cjs`); if absent, the feed still emits the category/tag/post lattice
  (graceful — repo/gist facets omitted, not fatal).
- **R5** The feed is valid JSON and parseable; cross-references use stable ids
  (`category:<slug>`, `tag:<slug>`, `repo:<owner>__<repo>`, `gist:<id>`).
- **R6** Generation is a Node script `scripts/build-ontology-feed.cjs` wired into
  the same build pipeline as `build-knowledge-graph.cjs` (runs before `hugo`).

## Acceptance contract
- `node scripts/build-ontology-feed.cjs` exits 0 and writes `static/data/ontology.json`.
- The JSON parses; `categories.length === 10`; every category has ≥1 tag.
- With `data/github.json` present: `repositories.length > 0` and `gists.length > 0`.
- `hugo --gc --minify` still exits 0 (feed is static data, no build impact).
- `node scripts/check-links.cjs` still reports 0 broken (feed is not linked, safe).

## Out of scope
- Rendering the feed as a visible page (the `/ontology/` page already exists; this
  is the data layer behind it).
- Modifying the 10-category taxonomy.
