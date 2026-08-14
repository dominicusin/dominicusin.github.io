# Content Model & CI Contract (Vector A)

The single normalized source of truth for all downstream consumers
(Vector Search, Knowledge Graph, syndication, AI-agent review).

## The Content Model

- **Schema:** [`schema/post-metadata.schema.json`](../../schema/post-metadata.schema.json)
  (JSON Schema draft-07). Defines the required/optional frontmatter for every post:
  `title`, `date`, `categories`, `tags`, `author`, `layout`, `permalink`
  plus `concepts` (Knowledge-Graph edges), `series`, `related_posts`, `seo`,
  `social`, `analytics`, `accessibility`.
- **Normative, not advisory.** Every post that lands on `main` must satisfy the
  schema. Legacy posts that pre-date the contract are exempt from the *hard*
  gate (they are not re-validated on unrelated commits); the gate applies to
  **changed posts only** (pre-merge).

## The CI Contract

Job `📜 Content Model Contract` in `.github/workflows/ci-cd.yml`
(`scripts/ci-content-contract.cjs`):

1. **Hard gate — `validate-frontmatter`**
   Changed `_posts/*.md` are validated against the schema. Any invalid post
   fails the build (`exit 1`). This is the Agent-driven Publishing Protocol's
   pre-merge check.
2. **Soft gate — `ai-review`**
   Changed posts are run through `scripts/ai-review.cjs` (frontmatter, internal/
   external link integrity, OpenGraph/SEO heuristics). Findings are reported but
   never fail the build.
3. **Emit — `build-knowledge-graph`**
   Produces `assets/data/knowledge-graph.json` (JSON-LD / SKOS-compatible) from
   each post's `concepts`. Consumed by Vector Search and the Knowledge Graph UI.

### Why changed-posts only

57 legacy posts were authored before the contract existed and lack some required
fields. Retroactively failing them would block every deploy. The contract is
enforced **forward** — any post you edit or add must comply. To bring a legacy
post into compliance, run `node scripts/validate-frontmatter.cjs _posts/<file>`
and add the missing fields.

## Local usage

```bash
node scripts/validate-frontmatter.cjs _posts/2026-08-14-deep-refactoring-plan.md
node scripts/ai-review.cjs _posts/2026-08-14-deep-refactoring-plan.md
node scripts/build-knowledge-graph.cjs
node scripts/ci-content-contract.cjs   # simulates the CI gate on changed posts
```

## Downstream consumers (roadmap)

- **Vector Search:** embed the normalized `concepts` + body, index in the PWA
  Service Worker's IndexedDB cache.
- **Knowledge Graph:** render `assets/data/knowledge-graph.json` as an
  interactive graph.
- **Syndication:** serialize the same model to RSS/Atom/JSON Feed + ActivityPub.
- **AI-agent review:** extend `ai-review.cjs` with link rot + geo checks.
