# BMAD — Initiative: `cross-links`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Contract → Spec Kit (`.specify/cross-links.md`). State → Beads. Execution → GSD.

## Why (reasoning)
The ontology is documented (TAXONOMY.md), visualized (KG + /ontology/),
machine-readable (`ontology.json`), and auto-ingested (repos/gists as pages).
But it is still *descriptive*, not *navigable*: a reader of a repository page
cannot jump to related repositories. A real knowledge graph is navigable.

## Pivot decision (locked #6) — data audit forced a scope change
Initial intent was post↔repo links by shared tag. A data audit proved **no
signal exists**: 0 post↔repo by tag, 0 by substring, 0 own-repo mentions in
post bodies (5745 github.com mentions are all *external* repos). Generating a
post↔repo artifact would be fabrication. We therefore pivot to **repo↔repo
related links**, which *is* richly supported by the data (every repo has
`language` + `topics`).

## Shape (locked decisions)
1. **Derive, never hand-link.** Build `data/crosslinks.json` with
   `repos[<fullName>].related = [<fullName>,...]` from shared `language` and/or
   shared `topics`. Generated at build, gitignored.
2. **Join signal = (same language) OR (≥1 shared topic).** Language is a strong
   signal (e.g. all C repos cluster); topics refine. Deduplicated, no self-links.
3. **Render as "Похожие репозитории"** at the end of each single repo page, via
   shared partial `layouts/partials/crosslinks.html`.
4. **Graceful:** absent `data/github.json`/`data/crosslinks.json` → partial
   renders nothing. No empty heading, no build failure.
5. **No secrets/network** at generation (filesystem only). Consistent with parent
   charter #3/#4.

## Out of scope (governance)
- post↔repo (no signal in data — see pivot #6).
- gist↔anything (gists lack topics/language).
- Modifying taxonomy or repo metadata.

## Handoff
- → Spec Kit `.specify/cross-links.md`: binding R1–Rn + acceptance.
- → Beads `.beads/beads.json`: nodes T15–T18.
- → GSD `.gsd/plan.md`: execution + evidence.
