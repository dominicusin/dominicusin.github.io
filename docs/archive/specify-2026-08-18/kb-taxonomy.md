# Spec — Deepen KB ontology: language concept layer + repo clustering

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/kb-taxonomy.md`.

## Context
Live KG: 393 nodes / 699 edges. 100/100 gists isolated (only `authored`); 121/128
repos degree ≤ 1; repo↔repo `relatedTo` = 6; repo `topics` too sparse (7 repos).
Real fields: repo `language` (70/128); gist file name (100/100) with 26/100 having
a code-language extension. Ingest writes only gist file `name` (no `lang`), so
`data/github.json` lacks gist language today.

## Requirements
- **R1** `sync-github.cjs` gist loop persists `lang` per file in `gistsOut.files`
  (`f.lang || guessLang(f.name)`), so `data/github.json` carries gist languages.
- **R2** `build-knowledge-graph.cjs`:
  - repo `tagged` → `lang:<Language>` concept when `r.language` set.
  - gist `tagged` → `lang:<fileLang>` for its primary code file (known code lang;
    skip `.txt`/no-ext). Keep existing `authored` edge.
  - repo↔repo `relatedTo` when both share a `lang:` concept (bounded by language,
    not full C(n,2)).
  - gist↔repo / gist↔gist stay linked only via the shared `lang:` concept.
- **R3** Rebuild KG; report measurable deltas: edges, isolated-gist count,
  repo↔repo relatedTo count. No edge without a real-field trace.
- **R4** Safety: `hugo` 0 errors; lint clean; test pass; check-links 0 broken;
  check-perf 0 regressions.

## Acceptance (measurable)
- built KG: gist `tagged` edges > 0 (≈26); repo `tagged` lang edges ≈ 70;
  repo↔repo `relatedTo` > 6; isolated-gist count drops (≥26 gists gain a `tagged`).
- `grep` `static/data/knowledge-graph.json` for `lang:python` / `lang:shell`.

## Out of scope
- NLP topic inference; gist display names; perf/CLS.
