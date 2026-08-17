# BMAD — Initiative: `kb-taxonomy`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Self-identified focus-topic (user): deepen the multi-layer ontology, expand the
> knowledge-base taxonomy. Contract → Spec Kit. State → Beads. GSD.

## Why (reasoning — measured, not guessed)
Audited the live KG (`static/data/knowledge-graph.json`, 393 nodes / 699 edges)
and the raw ingest (`data/github.json`). Connectivity baseline:
- **100 / 100 gist nodes are isolated** — only `authored` (person:dominicusin).
  No `tagged`, no concept links, no relation to repos.
- **121 / 128 repo nodes** have degree ≤ 1 (only `owns` by org).
- repo↔repo `relatedTo` = **6** (essentially no clustering).
- `topics` on repos: only 7 repos carry them (9 topics total) — too sparse to be
  the sole taxonomy axis.

Real, usable fields (verified):
- repos: `language` present on **70/128** (Python 13, C 8, Shell 6, TS 5, HTML 5,
  TeX 3, Nix 3, Haskell 2…).
- gists: `files[].name` present on all 100; **26/100** have a code language in the
  filename extension (sh/py/js/ts/md/scheme/c/hs/sql/nix/php/ps1…). BUT the ingest
  `gistsOut.files` (sync-github.cjs line ~308) writes ONLY the file `name`, not its
  `lang` — so `data/github.json` carries no gist language today.

So the taxonomy can be deepened honestly by adding a **language concept layer**
(derivable from real fields) and clustering repos by shared language. No fabricated
topics, no NLP guesses.

## Shape (locked decisions)
1. **T53 (ingest):** `sync-github.cjs` — in `main()` gist loop, persist `lang` per
   file into `gistsOut.files` (`f.lang || guessLang(f.name)`). Re-run ingest locally
   so `data/github.json` carries gist languages (CI regenerates on deploy).
2. **T54 (KG builder):** `build-knowledge-graph.cjs`
   - repo gets `tagged` edge to concept `lang:<Language>` when `r.language` exists.
   - gist gets `tagged` edge to concept `lang:<fileLang>` for its PRIMARY code file
     (first file whose `lang` is a known code lang; skip `.txt`/no-ext). Keeps the
     existing `authored` edge.
   - repo↔repo `relatedTo` when they share the same `lang:` concept (both have that
     language). This clusters repos into language communities. Bounded: only pairs
     that share a language, not a full C(n,2) blow-up.
   - gist↔repo / gist↔gist stay UN-linked directly; they meet via the shared
     `lang:` concept (correct multi-layer structure, no edge explosion).
3. **T55 (measure):** rebuild KG; report deltas: total edges 699→?, isolated gists
   100→?, repo↔repo relatedTo 6→?. Assert no fabricated edges (every edge traceable to
   a real field).
4. **T56:** commit + PR + `gh pr merge --admin`.

## Out of scope
- NLP/topic inference from descriptions (would fabricate concepts).
- Changing gist display names (done in #118).
- CLS/perf (separate).

## Handoff
- → Spec Kit `.specify/kb-taxonomy.md`.
- → Beads `.beads/beads.json`: T53–T56.
- → GSD `.gsd/plan.md`: Phase O.
