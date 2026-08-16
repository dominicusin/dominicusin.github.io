# Plan: Repositories & Gists ingestion, Tag Cloud, and Ontology expansion

> Goal (user directive): build a sound taxonomy of all posts + a **tag cloud**; deepen
> and widen the site **ontology**; and make **every `dominicusin` repo + associated-org
> repos (neoallunity, Hitech-gmbh, transgregorial, …) + every public gist** readable on
> the site — README / CONTRIBUTING / LICENSE / `docs/` / wiki — **automatically**, so a
> new gist or repo change shows up on the site without manual steps.

## 0. Ground-truth inventory (verified via `gh` API)

- **Repos** (`dominicusin`): 100+ public, many forks. Originals of note: `dominicusin.github.io`,
  `ai-orchestration-platform`, `integral-philosophy*` (under neoallunity), `SPF.JS`, `trackerslist`,
  `nixpkgs` fork, `GoodbyeDPI`, `DeepFaceLab` (fork), `aceproxy`, `DokanCloudFS`, `my-nixos-config`, …
- **Orgs**: `neoallunity` (incl. `integral-philosophy` suite + profile/README), `Hitech-gmbh`
  (placeholder only), `transgregorial` (nixpkgs, SPF.JS, trackerslist, amsbib, …).
- **Gists** (`dominicusin`): 43 public (config snippets, zfs/guix/arch notes, CA scripts, …).
- Existing: `sync_gists.yml` dumps gists to `gists/` but does **not** render them; `docs/` already
  published; repo wiki available at `git@github.com:dominicusin/dominicusin.github.io.wiki.git`.

## 1. Architecture — how "automatic" is achieved (no branch-protection fights)

**Principle: generate, don't commit.** Repo/gist pages are produced by a Node sync script that runs
**in CI immediately before `hugo`**, fetching live GitHub data. The *source repo* stays clean; the
*deployed site* always mirrors current GitHub state. This sidesteps branch protection and commit churn.

- `scripts/sync-github.cjs` (new): authed via `GITHUB_TOKEN` (public data, 5000 req/h — ample),
  fetches for owners `[dominicusin, neoallunity, Hitech-gmbh, transgregorial]`:
  - repo list (`/orgs/{o}/repos` + `/users/dominicusin/repos`), dedup by full_name;
  - per repo: `README`, `CONTRIBUTING`, `LICENSE`, `docs/**` index, repo metadata (desc, lang,
    topics, stars, fork/archived flags, default branch, html_url);
  - wiki: clone `{repo}.wiki.git` if present, list `.md` pages (best-effort, skip if absent);
  - gists: `/users/dominicusin/gists` + raw file contents.
  - Writes **Hugo content** into `content/repositories/<owner>/<repo>/` (README as `_index.md`,
    other docs as sibling pages) and `content/gists/<id>/index.md` (each file as a fenced code block
    with language hint). Writes `data/github.json` (cache + machine-readable index).
  - Regenerates `static/data/knowledge-graph.json` adding **repo** + **gist** node types linked to
    their topics/tags (ontology expansion).
  - **Rate-limit & robustness**: conditional requests (ETag/Last-Modified), skip binaries, cap doc
    size (e.g. 200 KB), 30s timeout, `try/catch` per repo so one failure can't break the build.
  - Generated files go to a path gitignored (or simply not committed — they live only in the runner).
    Local dev: `npm run sync:github` populates them for preview; `.gitignore` excludes
    `content/repositories/`, `content/gists/`, `data/github.json` from commits (they are build artifacts).

- **Trigger for "instant" updates**: `hugo.yml` gains a **cron schedule** (every 30 min) +
  `repository_dispatch` (webhook from GitHub when a repo/gist changes — enhancement) in addition to
  push-to-main. The `build` job calls `sync-github.cjs` before `hugo`. Deploy unchanged.

## 2. Taxonomy + Tag Cloud (local, safe)

- `docs/TAXONOMY.md` already defines 10 categories / 76 tags. Extend it with **repo/gist facets**:
  new tags for repo languages/topics (`nix`, `solidity`, `ai`, `privacy`, …) and a `repository` /
  `gist` content-type facet.
- **Tag cloud page** `/tags/` restyled as a weighted cloud (font-size ∝ post count), plus a reusable
  `{{< tagcloud >}}` shortcode for homepage/sidebar. Implemented via a partial reading
  `.Site.Taxonomies.tags` with a log-scaled size mapping + a `custom.css` cloud layout.
- Repos/gists also become KG `concept`/`tag` contributors (their GitHub topics flow into the tag set).

## 3. Ontology expansion (KG + document)

- New KG node types: `repository` (per repo, linked to owner org + topics), `gist` (per gist, linked
  to topics). Edges: `repo → topic`, `gist → topic`, `repo → owner(org)`, `repo → relatedPost` when a
  blog post references it.
- New **Ontology page** `/ontology/` (or section) generated from `data/github.json` + taxonomy: shows
  the category→tag→repo/gist lattice, linked into the interactive KG. A `static/data/ontology.json`
  mirrors it for the KG.
- KG generator updated to merge `github.json` (repos/gists) into the same graph.

## 4. Site pages

- **`/repositories/`** — index: filterable table/cards (owner org, language, topic, stars, fork/archived
  badge). Each repo page: hero (name, owner, desc, lang, stars, topics, links to GitHub + wiki),
  embedded **README** (rendered), tabs/sections for **Contributing**, **License**, **docs/**, **wiki**.
- **`/gists/`** — index of all gists (title, description, language, updated). Each gist page: all files
  rendered as syntax-highlighted code blocks with copy buttons + link to the gist.
- Navigation: add **Репозитории** (→ `/repositories/`) and **Гисты** (→ `/gists/`) under a new
  **Проекты/Код** dropdown (or top-level). Keep existing Профиль/Темы dropdowns.

## 5. Implementation order (sequential, each verified + PR)

1. **Tag cloud** — `tags/_index.md` cloud style + `tagcloud` shortcode + CSS; verify build. (PR A)
2. **sync-github.cjs** — fetch + write content (repos + gists) + `data/github.json`; run locally,
   inspect generated pages. (PR B)
3. **KG expansion** — repo/gist node types + ontology data; regenerate, verify graph. (PR C, may merge
   with B)
4. **Layouts/pages** — `repositories/` + `gists/` list + single templates, repo doc sections. (PR D)
5. **CI wiring** — add `sync-github` step + cron/`repository_dispatch` to `hugo.yml`; verify a scheduled
   dry run builds and deploys. (PR E)
6. **Ontology page** + taxonomy doc update. (PR F, may merge with C)

Each PR: branch → quality CI green → `gh pr merge --admin`. No direct pushes (branch protection).

## 6. Risks & mitigations

- **Rate limits**: authed 5000/hr; conditional requests + per-repo try/catch.
- **Forks/archived noise**: default filter hides forks/archived; toggle to show.
- **Wiki clone cost**: best-effort, skipped if absent/large.
- **Build fragility**: sync failures never fail the build (graceful degradation → site without that
  repo rather than broken deploy); script exits 0 on partial success.
- **Large repos/docs**: size caps; binaries skipped.
- **Secrets**: uses built-in `GITHUB_TOKEN` (no new PAT needed for public data).

## 7. Verification

- `npm run sync:github` populates `content/repositories/`, `content/gists/`, `data/github.json`.
- `hugo --gc --minify` builds 0 errors; `/repositories/`, `/gists/`, `/tags/` (cloud), `/ontology/`
  render; KG shows repo/gist nodes.
- `node scripts/check-links.cjs` 0 broken; `npm run lint`; `npx jest` green; Quality CI success.
- Live: new gist added → within cron interval appears on site automatically.
