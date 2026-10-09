# Architecture

The repository has one public product: a static Hugo site. GitHub Actions builds it with Hugo Extended 0.164.0 and the Blowfish v2.105.0 theme, then publishes the generated `public/` directory to GitHub Pages.

## Repository map

```text
content/                 Published articles, profiles, and reference pages
config/_default/         Hugo settings, language setup, and navigation
layouts/                 Hugo templates and site-specific theme overrides
assets/ static/ i18n/    Styles, images, public files, and translations
data/ scripts/           Source data and build-time generators
schema/                  Article metadata contract
themes/blowfish/         Hugo theme submodule
src/ contracts/ tests/   Retained engineering experiments and test suites
.github/workflows/       Build, quality, security, and integration automation
```

`content/`, `config/`, `layouts/`, theme overrides, and generated data form the publishing path. `src/` and `contracts/dao/` are an independent, retained R&D archive; Hugo does not bundle them into the website. The R&D test workflow is currently disabled in GitHub Actions because the DAO test job fails on `main`.

## Site build and publication

`.github/workflows/hugo.yml` is the only workflow that deploys to GitHub Pages. On a push to `main` or a scheduled repository sync, it:

1. checks out the repository and initializes the Blowfish theme;
2. installs the site generator dependencies from `scripts/`;
3. synchronizes repository and gist metadata and sanitizes generated content;
4. refreshes the knowledge graph, ontology feed, crosslinks, and curated-list catalog;
5. builds the site with Hugo and uploads the result to GitHub Pages.

`.github/workflows/quality.yml` is the required pull request quality gate. It builds the site, checks new article metadata and internal links, and runs lint and reporting checks. It does not publish. Separate active workflows handle end-to-end checks, security scans, and scheduled integrations. The R&D test workflow is disabled and does not validate pull requests.

## Content and generated data

- Put articles in `content/blog/` and site pages in their relevant `content/` section.
- Validate article front matter against `schema/post-metadata.schema.json` using `node scripts/validate-frontmatter.cjs <file>`.
- Keep stable URLs when moving content by adding a Hugo `aliases` entry for each old path.
- Build-generated catalog, graph, ontology, and crosslink data should be changed through their source content or generator, not by hand.

The content contract and authoring details are in [`CONTENT_CONTRACT.md`](CONTENT_CONTRACT.md) and [`PUBLISHING.md`](PUBLISHING.md). The architecture decision that records the publishing/R&D boundary is [`adr/0002-two-plane-architecture.md`](adr/0002-two-plane-architecture.md).

## Local workflows

For a site preview, install Hugo Extended 0.164.0 and Node.js 24, then run:

```sh
git submodule update --init themes/blowfish
npm ci --prefix scripts
node scripts/sync-github.cjs
node scripts/build-knowledge-graph.cjs
node scripts/build-ontology-feed.cjs
node scripts/build-crosslinks.cjs
node scripts/build-awesome.cjs
hugo server -D
```

The engineering archive has a separate root `package.json`. Install it with `npm ci`; use `npm run lint`, `npm test`, and `npx hardhat test` for its local checks.
