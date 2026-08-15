# scripts

Build-time tooling for the **Engineering Plane** (content-contract, knowledge
graph, DAO deploy). These run in CI and locally; they are not imported by the
Hugo site at runtime.

## Key scripts

| Script | Role |
|--------|------|
| `ci-content-contract.cjs` | CI gate. Hard-gates **new** posts against `schema/post-metadata.schema.json`; reports (soft) on modified legacy posts; emits the Knowledge Graph. |
| `validate-frontmatter.cjs` | Validates a single post's frontmatter against the schema. |
| `build-knowledge-graph.cjs` | Generates `static/data/knowledge-graph.json` (JSON-LD) from published content. Consumed by the `/knowledge-graph/` page widget. |
| `deploy-dao.cjs` | Hardhat deploy script for `contracts/dao/` (run by the guarded `deploy` job in `deploy-dao.yml`). |
| `check-links.cjs` | Crawls `public/` after build; exits 1 on broken internal links. Used by `quality.yml`. |
| `check-html.cjs` | Lightweight HTML well-formedness / `<img>`-alt spot-check (report-only, non-blocking). |
| `backfill-frontmatter.cjs` | Adds missing `author` (default `DominicusIn`) to legacy posts for SEO. |

## Usage

```bash
node scripts/ci-content-contract.cjs            # full gate + KG emit
node scripts/validate-frontmatter.cjs content/blog/2026-foo.md
node scripts/build-knowledge-graph.cjs
node scripts/backfill-frontmatter.cjs --dry-run # preview author backfill
```

See also: `docs/CONTENT_CONTRACT.md`, `docs/DAO_ROADMAP.md`.
