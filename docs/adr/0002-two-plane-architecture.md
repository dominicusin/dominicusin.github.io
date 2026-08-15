# ADR 0002 — Two-plane repository architecture (Publishing vs Engineering)

- **Status:** Accepted (verified 2026-08-15, after SSG migration + Phase 7)
- **Context:** The repository was migrated from a Jekyll + esbuild stack to
  Hugo + Blowfish (publishing) while retaining an engineering substrate
  (`src/` frontend modules, `contracts/dao/` Solidity, `tests/hardhat/`). Before
  this ADR the boundary was only described informally; CI mixed publishing and
  engineering concerns (e.g. Jekyll CI attempted to deploy, DAO deploy shared the
  repo). We need an explicit, operable boundary so that a Hugo failure never
  implies an engineering failure and vice-versa.
- **Decision:** The repository has two explicit planes:
  - **Publishing Plane** — ships the static site.
    - Generator: Hugo (extended) v0.164.0 + Blowfish v2.105.0 (submodule).
    - Content: `content/` (`blog/`, `people/`, `domini/`, `knowledge-graph/`).
    - Config: `config/_default/`, `i18n/`, `layouts/`, `assets/`, `static/`.
    - Single publisher: `.github/workflows/hugo.yml` → GitHub Pages (source =
      "GitHub Actions"). Nothing else may flip the Pages source.
    - Comments: giscus (GitHub Discussions). Subscription: Buttondown.
  - **Engineering Plane** — R&D, NOT deployed to the site.
    - `src/` — v4.0 ES modules (CRDT/P2P/DAO/BCI adapters). Not bundled by Hugo.
    - `contracts/dao/` — Solidity (GovernanceToken, SoulboundToken, ProposalEngine).
    - `tests/hardhat/` — Hardhat tests (`npx hardhat test`, 9 passing).
    - `scripts/` — content-contract + knowledge-graph generation (Node tooling).
  - **Content Contract** is the publishing-plane gate: new posts in
    `content/blog/` MUST satisfy `schema/post-metadata.schema.json` (hard gate in
    `hugo.yml`); modified legacy posts are report-only.
  - **Knowledge Graph** (`static/data/knowledge-graph.json`, JSON-LD) is a
    publishing-plane output generated from the engineering-plane scripts.
- **Integration points (allowed):**
  - Generated JSON (knowledge-graph) copied into `static/` by the build.
  - Hugo partials/shortcodes that read generated data.
  - Public demo pages that link to, but do not bundle, `src/` artifacts.
  - `scripts/` invoked by `hugo.yml` for content-contract + KG emission.
- **Non-integration (forbidden):**
  - Hugo MUST NOT `import` runtime code from `src/` (the static site ignores it).
  - `contracts/dao/` MUST NOT be deployed to GitHub Pages (separate Hardhat track).
  - Publishing and engineering deploys are independent workflows with independent
    failure domains.
- **DAO lifecycle (separate track):** `deploy-dao.yml` splits into a `test` job
  (no secrets, runs on push/PR to `contracts/**`) and a guarded `deploy` job that
  fails loudly without `DEPLOY_PRIVATE_KEY` / `SEPOLIA_RPC_URL`. DAO deploy does
  NOT run from PRs and is independent of the Hugo deploy.
- **Verification (reproducible):**
  - `themes/blowfish` is the only theme; `config/_default/config.toml` sets
    `theme = "blowfish"`.
  - Exactly one workflow has `pages: write` + `actions/deploy-pages` → `hugo.yml`.
  - `ci-content-contract.cjs` exits non-zero only for ADDED (new) invalid posts.
  - `npm run build` (Hugo) succeeds without any `src/` or `contracts/` artifact.
- **Consequences:**
  - A change to `src/` or `contracts/dao/` does not require a site rebuild.
  - A schema violation on a new post blocks the site deploy (quality enforced).
  - Engineering plane may be frozen/extended without touching the publishing plane.
- **Alternatives considered:**
  - Physical split into `website/` + `engineering/` subdirs (deferred — large
    reference churn, no immediate architectural win; logical boundary is enough).
  - Single combined CI that deploys both (rejected — couples failure domains).
