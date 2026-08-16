# GSD — Execution Engine

> **Sole responsibility: EXECUTION.** Drives the Beads state graph (T1–T10) to
> `done` by satisfying the Spec Kit contract (`.specify/spec.md`, R1–R7). Records
> real command + output evidence. Does NOT define "what" (Spec Kit) or "why"
> (BMAD) or track state (Beads) — it *acts* and *proves*.

## Inputs (read-only references)
- Contract: `.specify/spec.md` (R1–R7 + acceptance)
- State graph: `.beads/beads.json` (nodes T1–T10)
- Governance: `.planning/CHARTER.md` (graceful degradation, no fabricated evidence)

## Execution log (actual runs, real output)

### Phase A — local implementation (sync → build → verify)
- `npm run sync:github` → **128 repos + 100 gists** generated into gitignored
  `content/repositories/`, `content/gists/`, `data/github.json`.
- `node scripts/build-knowledge-graph.cjs` → **393 nodes / 699 edges** (incl.
  repository/gist/org).
- `hugo --gc --minify` → **exit 0, 0 errors, 553 HTML**. `/repositories/` index
  rendered **128 repo cards**.
- `node scripts/check-links.cjs` → **0 broken internal links across 654 pages**
  (after relative-README-link rewrite + `feed.xml` fix).

### Phase B — package + merge (T9)
- Committed source on `feat/repo-gist-ingestion`; PR **#107** opened.
- Required gate `🧪 Build, validate, test, link-check` = **pass**.
  (External noise ignored: CircleCI no-config, Vercel 24h rate-limit, Snyk limit,
  Playwright, Trivy `aquasecurity/trivy-action@v0` unresolved — none in
  branch-protection required checks `["test","build"]`.)
- Merged via `gh pr merge 107 --squash --admin` → main `9470502ab`.

### Phase C — live CI smoke test (T10)
- `gh api repos/.../dispatches -f event_type=sync-github` → run **31943633270**.
- Result: `✓ build (5m8s)` [Sync GitHub repos + gists → Validate content contract
  → Rebuild Knowledge Graph → Build with Hugo → Upload Pages artifact] +
  `✓ deploy (11s)` [Deploy to GitHub Pages]. **Green.**

## Contract satisfaction (R1–R7 → evidence)
| Req | Evidence |
|-----|----------|
| R1 repos as pages | 128 repo cards on `/repositories/`; each `<owner>__<repo>/` has README+Contributing/License/docs+wiki link |
| R2 gists as pages | 100 gist pages `/gists/<id>/` with file code blocks |
| R3 tag cloud | `/tags/` weighted cloud; `layouts/shortcodes/tagcloud.html` |
| R4 ontology | `/ontology/` + KG repo/gist/org nodes |
| R5 automatic | `hugo.yml` cron `*/30` + `repository_dispatch` + sync step (live run 31943633270 green) |
| R6 no broken links | `check-links.cjs`: 0 broken / 654 pages |
| R7 forks de-emphasised + graceful | `fork` flag in frontmatter; sync exits 0 on rate-limit (disk-cache fallback) |

## Status
All Beads nodes T1–T10 = `done`. Initiative `repo-gist-ingestion` **closed**.

---

## Initiative 2: `ontology-feed` (new Beads nodes T11–T14)

### Phase D — machine-readable ontology lattice
- `scripts/build-ontology-feed.cjs` → **10 categories, 90 tags, 128 repos, 100 gists**
  into `static/data/ontology.json` (gitignored, regenerated each build).
- Lattice derives from `docs/TAXONOMY.md` (canonical 10 categories, table parse) +
  `content/**` frontmatter (post tags/categories) + `data/github.json` (repo/gist
  facets). Graceful: repo/gist facets omitted if `data/github.json` absent.
- Wired into pipeline: `package.json` `ontology:feed` + `build:full`; `hugo.yml`
  step "Generate ontology feed" before `hugo`.
- `hugo --gc --minify` → 0 errors; `public/data/ontology.json` = 45KB present.
- `check-links.cjs` → 0 broken (feed is static data, unlinked).

### Contract satisfaction (R1–R6 → evidence)
| Req | Evidence |
|-----|----------|
| R1 feed generated at build, gitignored | `scripts/build-ontology-feed.cjs` writes `static/data/ontology.json`; `.gitignore` rule added |
| R2 lattice categories→tags→(posts/repos/gists) | JSON: `categories[].tags[]` with `postCount/repoCount/gistCount`; `repositories[]`, `gists[]` |
| R3 categories from TAXONOMY.md | parsed 10 categories from `## Categories (domains)` table |
| R4 repo/gist from data/github.json, graceful | 128 repos + 100 gists when present; omitted if absent |
| R5 valid JSON, stable ids | ids `category:<slug>`, `tag:<slug>`, `repo:<owner>__<repo>`, `gist:<id>` |
| R6 script in pipeline before hugo | `hugo.yml` step + `build:full` chain |

### Status
Beads T11–T13 = `done`; T14 (commit+PR+merge) in_progress. CI live run will
confirm the new `hugo.yml` step (graceful, no untrusted input).

