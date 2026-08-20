# ADR 0003 — Mirroring the GitHub Wiki into the published site

- **Status:** Accepted (verified 2026-08-20, after submodule + pre-build nav script)
- **Context:** The repository's operational/security documentation lives in the
  GitHub Wiki (`dominicusin.github.io.wiki`). We want that content surfaced on the
  published site as a documentation section, kept in sync automatically. Two
  constraints shape the design:
  1. **Blowfish (v2.105.0, submodule) has no built-in hierarchical docs-tree
     sidebar.** Verified in `themes/blowfish/layouts/`: navigation is built
     exclusively from `.Site.Menus.main` (flat list via `menu:` front matter or
     `hugo.toml [menu]`. There is no Docsy/hugo-book style auto-tree, no
     `hasChildren`/`Parent` support, no sidebar partial. This was confirmed by
     code inspection, not assumed.
  2. The wiki is a separate git repository. Embedding it via `<iframe>` is
     impossible — GitHub Wiki sends `X-Frame-Options: DENY` / CSP, so no
     in-page embedding. Content must be built into the static site.
- **Decision:** Mirror the wiki as a **git submodule** at `content/wiki/`
  (read-only during build) and generate navigation with a **pre-build Python
  script** (`scripts/generate-wiki-nav.py`):
  - The submodule is never written to. The script reads `content/wiki/*.md`
    and copies each page into `content/wiki-build/` (git-ignored intermediate
    dir) with injected `menu.main` front matter (title from H1, stable weight,
    `identifier`).
  - `content/wiki-build/_index.md` defines the "Wiki" section in `menu.main`
    (weight 110; child pages 111..). This gives a flat but correct nav that
    Blowfish can render.
  - `hugo.yml` runs `git submodule update --init --recursive content/wiki` then
    the script, then the normal build. No new workflow is added (avoids the
    existing 13-workflow sprawl).
- **Sync trigger:** The wiki submodule is refreshed on every `hugo.yml` run.
  `hugo.yml` already triggers on a `*/30 * * * *` cron (repo/gist sync) and on
  `push`/`repository_dispatch`/`workflow_dispatch`. The submodule update rides
  those triggers, so wiki edits land on the site within ≤30 min with no extra
  workflow. (A `repository_dispatch` webhook from the wiki repo would make this
  near-instant but requires config in the wiki repo — out of scope here.)
- **Source of truth:** the wiki repo remains authoritative for that content.
  The site is a read-only mirror; there is **no reverse sync** (site edits do
  not write back to the wiki).
- **Limitations (explicit):**
  - One-directional sync (wiki → site). No site→wiki path.
  - Up to ~30 min latency between a wiki edit and its appearance on the site.
  - Flat navigation (no nested sidebar) — a consequence of Blowfish, not a bug.
  - Wiki structure must stay shallow (single level of `.md` files) for the
    script's flat-weight scheme to remain sensible; nested folders would need
    cascade/section-weight extensions.
- **Alternatives considered:**
  - `hugo-book` / `docsy` themes — rejected: would replace Blowfish, a much
    larger change than the doc requirement justifies.
  - Manual copy of wiki into `content/` — rejected: drift-prone, no automation.
  - `{{< readfile >}}` / iframe embeds — rejected: iframe blocked by GitHub
    Wiki CSP; readfile still requires the content to live in the repo.
