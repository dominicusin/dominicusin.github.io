# BMAD — Initiative: `ontology-feed`

> Governance/reasoning only: WHY this exists, its SHAPE, and locked decisions.
> Contract → Spec Kit (`.specify/ontology-feed.md`). State → Beads. Execution → GSD.

## Why (reasoning)
The site declares an explicit taxonomy (docs/TAXONOMY.md: 10 categories, ~76 tags)
and an interactive KG (repository/gist/org nodes added in `repo-gist-ingestion`).
But the ontology is only *human-readable* (a doc + a D3 graph). To truly "develop
and deepen the ontology," it must also be *machine-readable and self-describing* —
a single artifact external tools, the KG loader, and future automation can consume.
Today the KG JSON is a raw node/edge dump; there is no canonical category→tag→repo→gist
lattice.

## Shape (locked decisions)
1. **One artifact: `static/data/ontology.json`.** Generated at build time (like
   `knowledge-graph.json`), gitignored, regenerated every build. Never hand-edited.
2. **Lattice, not flat list.** Structure = `categories → tags → (posts, repositories,
   gists)` with explicit `relatedTo` edges. Consumed by the KG loader and/or a
   future `/ontology.json` endpoint.
3. **Derived, not duplicated.** Built FROM existing sources (TAXONOMY.md categories,
   Hugo taxonomies, `data/github.json` repos/gists) — no new hand-maintained data.
4. **Graceful:** if `data/github.json` is absent (sync not run), the feed still
   emits the category/tag/post lattice; repo/gist facets are omitted, not fatal.
5. **No secrets, no network** at generation time (pure filesystem + Hugo taxonomy
   introspection). Consistent with BMAD decision #3 from the parent charter.

## Out of scope (governance)
- Changing the 10-category model (that lives in TAXONOMY.md / Spec Kit).
- Replacing knowledge-graph.json (this is a *complementary* lattice view).
- Live publishing of the feed off-site (out of scope; artifact is local).

## Handoff
- → **Spec Kit** `.specify/ontology-feed.md`: binding R1–Rn + acceptance.
- → **Beads** `.beads/beads.json`: nodes T11–T14.
- → **GSD** `.gsd/plan.md`: execution + evidence.
