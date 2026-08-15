# Publishing Rules

How to publish content to `dominicusin.github.io` without breaking the pipeline.
The site is built by Hugo (Blowfish theme) and deployed via GitHub Pages.
Architecture is the **two-plane** model (see `docs/adr/0002-two-plane-architecture.md`):

- **Publishing Plane** — `content/`, `config/_default/`, `layouts/`, `static/`, `i18n/`.
  Deployed to GitHub Pages by `.github/workflows/hugo.yml` (the only publisher).
- **Engineering Plane** — `contracts/dao/`, `tests/hardhat/`, `src/`. Never deployed
  to Pages; tested by the DAO/Hardhat jobs.
- **Content Governance Plane** — `schema/post-metadata.schema.json`,
  `scripts/ci-content-contract.cjs`, `scripts/validate-frontmatter.cjs`,
  `scripts/build-knowledge-graph.cjs`. Validates and links content.

## Author checklist before pushing a new post

1. Create the file under `content/blog/` with a date-prefixed slug:
   `content/blog/YYYY-MM-DD-your-slug.md`.
2. Frontmatter **must** satisfy `schema/post-metadata.schema.json`:
   - `title` (string)
   - `date` (ISO 8601, e.g. `2026-08-15T12:00:00.000Z`)
   - `slug`
   - `description`
   - `categories` — **must** be from the enum (`systems`, `industrial`,
     `data-science`, `decentralized`, `dao`, `semantic`, `ai`, `jekyll`,
     `update`)
   - `tags` (array)
   - `author` (recommended; legacy posts were backfilled with `DominicusIn`)
3. Validate locally:
   ```bash
   node scripts/validate-frontmatter.cjs content/blog/YYYY-MM-DD-your-slug.md
   # or the full gate (also emits the Knowledge Graph):
   node scripts/ci-content-contract.cjs
   ```
4. Preview: `hugo server -D` (or `make serve`).
5. Open a PR. The **hard gate** runs on **new/added** posts — an invalid new
   post blocks the merge/deploy. Modified legacy posts are **report-only**
   (soft), so historical posts with missing fields won't fail the build.

## What the CI enforces

| Workflow | What | Blocks deploy? |
|----------|------|----------------|
| `hugo.yml` | Build + **content-contract hard gate (new posts)** + deploy | ✅ (it is the deploy) |
| `quality.yml` | Build + content-contract (report) + jest + hardhat + lint + broken-link check | PR check (separate track) |
| `e2e.yml` | Playwright smoke + axe-core a11y | separate track |
| `performance.yml` | Lighthouse budget (LCP≤2.5s, CLS≤0.1) | separate track (fails job, not site) |
| `security.yml` | npm audit + Trivy + Semgrep | separate track |

## Knowledge Graph

Every build regenerates `static/data/knowledge-graph.json` (JSON-LD) from the
published content. It is rendered by the `/knowledge-graph/` page widget.
Concepts come from post `tags`/taxonomy; to make a post appear in the graph,
give it meaningful `tags`.

## Legacy URLs & aliases

Hugo preserves old URLs via `aliases` in frontmatter and Blowfish redirects.
If you move/rename a post, add `aliases: [/old/path/]` so inbound links don't
404. Verify with `node scripts/check-links.cjs` after a build.

## What never goes to Pages

`contracts/dao/`, Hardhat `artifacts`/`cache`, `node_modules`, test output, and
DAO deployment state are engineering artifacts and are gitignored / excluded
from the build. `public/` is generated and never committed.
