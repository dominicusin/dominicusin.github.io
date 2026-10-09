# Publishing Rules

How to publish content to `dominicusin.github.io` without breaking the pipeline.
The site is built by Hugo (Blowfish theme) and deployed via GitHub Pages.
Architecture is the **two-plane** model (see `docs/adr/0002-two-plane-architecture.md`):

- **Website** — `content/`, `config/`, `layouts/`, `assets/`, `static/`, `i18n/`,
  and the build-time generators. `.github/workflows/hugo.yml` is the only publisher.
- **Engineering archive** — `src/`, `contracts/dao/`, and their tests. It is
  retained for research and is not shipped with the website.

The article schema and scripts are part of the publishing workflow: they validate
articles and generate the graph, ontology feed, crosslinks, and curated-list data.

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

| Workflow | What | Release role |
|----------|------|----------------|
| `hugo.yml` | Generate site data, build Hugo, and publish to GitHub Pages | Builds and publishes the site |
| `quality.yml` | Hugo build, content contract, lint, internal-link checks, and report-only audits | Required PR check; blocks merge on failure |
| `test-rnd.yml` | Jest and Hardhat checks for changes to the engineering archive | Separate R&D check |
| `e2e.yml` | Playwright end-to-end checks | Separate check |
| `performance.yml` | Lighthouse performance audit | Separate check |
| `security.yml` | npm audit, Trivy, and Semgrep scans | Separate check |

## Knowledge Graph

Every deployment regenerates `static/data/knowledge-graph.json` (JSON-LD) from the
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
