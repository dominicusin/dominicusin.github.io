# Spec — Repositories & Gists Auto-Ingestion + Tag Cloud + Ontology

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Source of truth for acceptance: `scripts/check-links.cjs` + `hugo` build must pass.

## Requirements
- **R1** Every public repo of `dominicusin` + orgs `neoallunity`, `Hitech-gmbh`,
  `transgregorial` is rendered as a site page at `/repositories/<owner>__<repo>/`
  with: header (owner, stars, language, topics, links to GitHub + wiki), and body
  = README, plus Contributing / License / docs sections when present.
- **R2** Every public gist of `dominicusin` is rendered at `/gists/<id>/` with all
  file contents as code blocks.
- **R3** `/tags/` is a weighted tag cloud (log-scaled by post count), RU-labelled,
  with a `tagcloud` shortcode reusable elsewhere.
- **R4** The site ontology page `/ontology/` documents the model and reuses the
  interactive KG, now including `repository` / `gist` / `org` node types.
- **R5** Updates are automatic: a scheduled CI run (`hugo.yml`, cron `*/30`) plus
  `repository_dispatch` re-runs `sync-github` + KG + build + deploy, so a new
  gist/repo or README change appears on the site within ~30 min without manual steps.
- **R6** Relative links/images inside fetched READMEs are rewritten to absolute
  GitHub URLs (no broken internal links on the site).
- **R7** Forks and archived repos are discoverable but visually de-emphasised
  (default filter hides forks on the index). Failures degrade gracefully.

## Acceptance contract
- `hugo --gc --minify` exits 0, 0 errors.
- `node scripts/check-links.cjs` reports **0 broken internal links** across the
  generated + existing pages.
- `node scripts/build-knowledge-graph.cjs` regenerates `static/data/knowledge-graph.json`
  including repo/gist/org nodes.
- `/repositories/` index lists every ingested repo (verified: ≥128 cards).
- A manual `gh workflow run hugo.yml` with `INCLUDE_WIKI=true` succeeds and the
  site serves at least one wiki-rendered repo page.

## Out of scope
- Editing/creating repos or gists from the site (read-only mirror).
- Private repos.
- Full recursive doc trees for every repo (only README + Contributing + License +
  a curated `docs/` probe; wiki opt-in).

## Handoff (Spec Kit owns the "what" only)
- → **Beads** (`.beads/beads.json`): the state graph (task nodes T1–T10 + edges).
  Spec Kit does not track status.
- → **GSD** (`.gsd/plan.md`): the execution engine that satisfies this contract
  and records evidence. Spec Kit does not execute.
- Governance context lives in **BMAD** (`.planning/CHARTER.md`); not restated here.
