# Contributing

This repository publishes a Hugo site and retains a separate engineering archive. See the [README](README.md) for the project map and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the build boundary.

## Site content

1. Add articles under `content/blog/` and pages under the appropriate `content/` section.
2. Keep front matter aligned with `schema/post-metadata.schema.json` and preserve old URLs with Hugo aliases when renaming content.
3. Validate a new article with `node scripts/validate-frontmatter.cjs content/blog/<file>.md`.
4. Follow the author checklist in [docs/PUBLISHING.md](docs/PUBLISHING.md).

For a local site preview, install Node.js 24 and Hugo Extended 0.164.0, then initialize the theme and generators:

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

## Engineering archive

`src/` and `contracts/dao/` are retained research projects and are not included in the published site. Install the root Node dependencies to work on them:

```sh
npm ci
npm run lint
npm test
npx hardhat test
```

## Pull requests

- Open changes against `main` and describe the user-visible or maintenance outcome.
- The required **Quality CI** check builds Hugo and checks content metadata, lint, and internal links. Playwright and security workflows run separately.
- The R&D test workflow is currently disabled because its DAO test job fails on `main`; archive test commands remain available locally.
- Keep generated build output, dependency folders, and Hugo caches out of commits.
