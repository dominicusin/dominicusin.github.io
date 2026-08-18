# Spec — Cross-links (related repositories)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/cross-links.md` (incl. pivot decision #6).

## Requirements
- **R1** `data/crosslinks.json` is generated at build time (gitignored):
  `{ repos: { <fullName>: { related: [<fullName>,...], byLanguage:[...], byTopic:[...] } } }`.
- **R2** Join signal: two repos are related when they share **the same
  `language`** OR **≥1 shared `topic`** (case-insensitive). No self-links,
  deduplicated.
- **R3** Every single **repository** page renders a "Похожие репозитории" section
  (via partial) listing related repos with links to
  `/repositories/<owner>__<repo>/`.
- **R4** The partial is **graceful**: when `data/crosslinks.json` (or
  `data/github.json`) is absent, it renders nothing — no empty heading, no error.
- **R5** Generation is `scripts/build-crosslinks.cjs`, wired into the build
  pipeline before `hugo` (alongside sync-github / KG / ontology-feed).
- **R6** Link targets are valid existing repo pages (no broken internal links).

## Acceptance contract
- `node scripts/build-crosslinks.cjs` exits 0, writes `data/crosslinks.json`.
- JSON parses; at least one repo has `related.length > 0`.
- `hugo --gc --minify` exits 0; ≥1 repo page shows "Похожие репозитории" with
  real links.
- `node scripts/check-links.cjs` reports 0 broken internal links.

## Out of scope
- post↔repo (no signal in data — pivot decision #6).
- gist linking (gists lack topics/language).
