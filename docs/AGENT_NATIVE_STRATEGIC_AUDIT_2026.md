# Agent-Native Strategic Audit — `dominicusin.github.io` (2026-08-18)

> Method: Observe → Inventory → Verify → Reconcile → Decide → Plan → Execute. This document is evidence-based: CODE > CONFIG > CI > TESTS > RECENT GIT HISTORY > CURRENT DOCS > OLD DOCS.

## 1. Executive Summary

- **FACT:** The production site is a Hugo static site using Blowfish, configured under `config/_default/`, with GitHub Pages deployment in `.github/workflows/hugo.yml`.
- **FACT:** The repository also contains a separate engineering/R&D plane: `src/` JavaScript modules, DAO Solidity contracts, tests, and agent/content scripts.
- **FACT:** Legacy Jekyll publishing files are no longer the production path; remaining stale references exist in some workflows/docs/scripts and should be reconciled, not blindly executed.
- **RISK:** CI and automation are powerful but uneven: GitHub Pages is protected by the content contract, while Vercel and some scheduled automations can diverge or mutate state with weaker gates.
- **DECISION:** Do not migrate away from Hugo now. The safest target is incremental hardening of the current Hugo + Blowfish publishing plane, strict isolation of R&D, and an agent-native workflow with explicit human gates.

## 2. Verified Current State

| Area | Status | Evidence |
|---|---|---|
| SSG | **FACT:** Hugo `0.164.0` is the configured production generator; `theme = "blowfish"` is declared in `config/_default/config.toml`. | `config/_default/hugo.toml`, `config/_default/config.toml`, `.github/workflows/hugo.yml` |
| Production content | **FACT:** Blog posts are in `content/blog/`; Hugo permalinks preserve dated URLs. | `content/blog/`, `config/_default/hugo.toml` |
| Theme | **FACT:** Blowfish is a git submodule at `themes/blowfish`; local submodule is not initialized in this checkout. | `.gitmodules`, `git submodule status` |
| CI deploy | **FACT:** `hugo.yml` builds with Hugo, syncs GitHub data, validates content contract, generates derived data, uploads Pages artifact, and deploys. | `.github/workflows/hugo.yml` |
| Quality CI | **FACT:** `quality.yml` builds, validates, lints, runs Jest/Hardhat, internal links, HTML, a11y, OG-image checks; several checks are report-only. | `.github/workflows/quality.yml` |
| Tests | **FACT:** `npm test` passed locally: 21 Jest suites / 273 tests passed; Hardhat passed 9 tests with Solidity warnings. | command output 2026-08-18 |
| Build | **FACT:** `npm run build` failed locally because `hugo` is not installed in this environment. | command output 2026-08-18 |
| Security | **FACT:** `npm audit` reports 42 total vulnerabilities, 10 high, 18 moderate, 14 low, 0 critical. | command output 2026-08-18 |
| Content model | **FACT:** `schema/post-metadata.schema.json` is the post metadata schema; `ci-content-contract.cjs` enforces added posts and emits knowledge graph. | `schema/`, `scripts/` |
| Search | **FACT:** Blowfish search is enabled and Fuse.js is vendored in project assets. Separate R&D search code references Lunr/vector fallback but is not proven shipped in the Hugo runtime. | `config/_default/params.toml`, `layouts/partials/head.html`, `src/modules/search-engine.js` |
| Community | **FACT:** giscus comments and Buttondown subscription are configured. | `config/_default/params.toml`, `layouts/partials/comments.html`, `layouts/partials/subscription.html` |
| Analytics/RUM | **FACT:** Firebase public client config is present for views/likes; RUM docs/assets exist. **UNKNOWN:** Whether backend/security rules are configured correctly. | `config/_default/params.toml`, `docs/RUM_SETUP.md`, `assets/rum/` |
| GitHub metadata | **UNKNOWN:** Open issues/PRs could not be queried because `gh` is not authenticated and no remote is configured in this checkout. | `gh issue list`, `git remote -v` |

## 3. Architecture Map

```text
Git repository
├─ Publishing plane [PRODUCTION]
│  ├─ Source: content/, config/_default/, layouts/, assets/, static/, i18n/
│  ├─ Transform: scripts/sync-github.cjs, ci-content-contract, KG/ontology/crosslinks generators
│  ├─ Build: Hugo 0.164.0 + Blowfish
│  ├─ Artifact: public/ Pages artifact
│  └─ Runtime: static HTML/CSS/JS on GitHub Pages; optional Vercel config exists
├─ Engineering / R&D plane [R&D]
│  ├─ src/ ES modules: agents, services, search, CRDT/P2P/BCI/analytics experiments
│  ├─ contracts/dao/ Solidity contracts
│  ├─ tests/ unit/integration/hardhat/e2e/a11y
│  └─ demo/, workers/
├─ CI/CD plane [PRODUCTION SUPPORT]
│  ├─ hugo.yml: canonical Pages deploy
│  ├─ quality.yml/e2e.yml/performance.yml/security.yml: gates and monitors
│  ├─ deploy-dao.yml: R&D deploy guarded by secrets
│  └─ scheduled automations: gist sync, analytics, link repair
└─ Planning/agent plane [META]
   ├─ docs/ strategy/architecture/operations/content
   ├─ .planning/ BMAD governance
   ├─ .specify/ + .openspec/ requirements/change contracts
   ├─ .beads/ task graph
   └─ .gsd/ execution evidence
```

Classification:

| Component | Class | Notes |
|---|---|---|
| `content/`, `config/_default/`, `layouts/`, `assets/`, `static/`, `i18n/` | PRODUCTION | Hugo source of truth. |
| `themes/blowfish/` | PRODUCTION dependency | Must be initialized/pinned in CI. |
| `public/`, `resources/`, `static/data/*.json`, `data/crosslinks.json`, `content/repositories/` | GENERATED | Should not be hand-edited. |
| `src/`, `contracts/dao/`, `demo/`, `workers/` | R&D | Tested/compiled but should not accidentally ship unless explicitly promoted. |
| old Jekyll references, `sync_gists.yml` output to `gists/` | LEGACY/STALE | Candidate for consolidation with Hugo sync flow. |
| `dist/`, `js/` | ABSENT/LEGACY | Requested paths are not current tracked production paths in this checkout. |

## 4. Technical Debt

| Priority | Item | Status | Remediation |
|---|---|---|---|
| P0 | Local/agent environment cannot build without Hugo installed. | FACT | Add documented bootstrap or CI-compatible tool setup script; do not mask build failures. |
| P1 | Dependency update workflow still runs Ruby/Bundler and `npm run build:test`, both stale for current Hugo setup. | STALE/RISK | Replace with Node/Hugo-only dependency PR workflow or disable until fixed. |
| P1 | `sync_gists.yml` writes `gists/*` while production ingestion uses `scripts/sync-github.cjs` and `content/gists/`. | STALE/RISK | Retire or rewrite as dispatch-only to `hugo.yml`. |
| P1 | Vercel config exists with inverted `ignoreCommand`; dual publisher can bypass GitHub Pages gates. | RISK | Decide canonical publisher/preview role; enforce content contract in every deploy path. |
| P1 | Security workflow gates only critical npm audit; 42 findings remain. | RISK | Triage dev-only vs exploitable; pin/upgrade or document exceptions. |
| P2 | Jest config quarantines several suites; `npm test` reports a11y no-tests as non-blocking. | FACT/RISK | Repair quarantined tests in small PRs; separate unit vs e2e/a11y commands. |
| P2 | R&D `src/` contains runtime assumptions like `/api/analytics`; production support is unclear. | RISK | Keep R&D isolated; require promotion checklist before shipping. |
| P2 | Documentation volume is high and partially overlapping. | FACT | Consolidate sources of truth; archive superseded docs. |
| P3 | Taxonomy and multilingual parity are not fully proven. | UNKNOWN/RISK | Audit content parity and taxonomy coverage before adding languages. |

## 5. Contradictions

| Document / Config | Assumed State | Verified State | Relevance | Action |
|---|---|---|---|---|
| `README.md` | Hugo + Blowfish, two-plane model | Matches core code/config; minor content path mentions not all directories exist as described. | CURRENT | Keep, update small inaccuracies only. |
| `AGENTS.md` | Hugo production, frozen R&D plane | Matches verified architecture. | CURRENT | Keep as top-level agent contract. |
| `docs/STRATEGIC_PLAN_2026-2027.md` | Jekyll collections, 17 tests, no coverage, 68KB bundle | Current repo has Hugo, 273 Jest tests, c8 coverage output, and no Jekyll publishing path. | STALE | Mark superseded/archive; extract durable goals only. |
| `docs/SSG_MIGRATION_PLAN.md` | Revised migration analysis | Mostly historical; migration appears complete. | PARTIAL/HISTORICAL | Keep as history; do not use as active plan. |
| `docs/ROADMAP_STATUS.md` | Current strategic synthesis | Strongly matches current architecture; includes Vercel warning. | CURRENT | Promote as living roadmap until this audit replaces/updates it. |
| `.planning/CHARTER.md` | BMAD owns WHY for repo/gist ingestion | Matches planning stack model but narrow initiative scope. | CURRENT for initiative | Keep; create new charter only for new initiative. |
| `.specify/spec.md` / `.openspec/*` | Repo/gist ingestion contract | Implemented and closed. | CURRENT/HISTORICAL | Keep as closed spec; do not extend for unrelated work. |
| `.beads/beads.json` | State graph | Needs ongoing synchronization check. | UNKNOWN | Audit before using as active task source. |
| `.github/workflows/dependency-update.yml` | Ruby/Jekyll-era dependency automation | Conflicts with Hugo-only production and references missing script. | STALE | Fix/disable. |
| `.github/workflows/fediverse-notify.yml` | Hashtags include `#jekyll`; URL construction bypasses Hugo permalink logic. | Production is Hugo. | STALE/RISK | Update tags and URL derivation or disable. |

## 6. Risks

- **P0:** Agent/local builds can silently proceed without a successful Hugo build if the agent does not check `npm run build` output.
- **P1:** Dual deployment surfaces can publish different validation states.
- **P1:** Scheduled automations with write/publish permissions can mutate state outside PR review.
- **P1:** Supply-chain risk from large dev dependency tree and submodule dependency.
- **P2:** R&D code with API endpoints/experimental features could be accidentally promoted into production.
- **P2:** Future-dated posts are not rendered by default Hugo builds; content scheduling needs explicit policy.
- **P2:** Public Firebase config is normal for web apps but security depends on external Firestore rules, which are unknown.
- **P3:** Search/data payload growth from repos/gists can impact performance without budgets.

## 7. Strategic Options

1. **Option A — Harden current Hugo + Blowfish architecture (recommended).** Lowest migration cost, preserves URLs/content, focuses on gates, docs consolidation, performance/security baselines.
2. **Option B — Hugo production + Astro R&D island prototype.** Useful only if interactive islands become a measured requirement; keep as experiment branch, not production migration.
3. **Option C — Full Astro migration.** Higher cost/risk; only justified if Hugo cannot satisfy required interactivity, content modeling, or agent workflow after measurable attempts.
4. **Option D — Freeze publishing and focus only on R&D.** Protects experimentation but underinvests in blog reliability and content operations.

## 8. Recommended Target Architecture

Current → Transitional → Target:

- **Current:** Hugo production + R&D plane + multiple planning systems + several stale workflows.
- **Transitional:** Hugo remains production; all deploy paths receive the same content/build gates; stale Jekyll automation is removed or archived; R&D promotion requires explicit checklist.
- **Target:** Agent-native static engineering blog with one canonical publishing pipeline, one content schema, one task graph, one decision log, reproducible local/CI tooling, and human approval for irreversible changes.

SSG comparison:

| Критерий | Current Hugo+Blowfish | Hugo | Astro | Alternative: Eleventy |
|---|---:|---:|---:|---:|
| Content | Strong | Strong | Strong | Strong |
| Performance | Strong if measured | Strong | Strong | Strong |
| SEO | Strong via Blowfish/JSON-LD | Strong | Strong | Medium/strong |
| i18n | Present ru/en | Good | Good | Medium |
| Search | Fuse built-in + KG | Good | Custom needed | Custom needed |
| Interactive islands | Limited | Limited | Strong | Medium |
| AI features | Build-time scripts | Build-time scripts | Strong islands | Scripts |
| CI complexity | Moderate | Low/moderate | Higher migration | Moderate |
| Supply chain | Moderate Node dev deps + Go binary | Lower if pruned | Higher Node app surface | Moderate |
| Maintenance | Good | Good | Good but migration required | Good |
| Migration cost | None | None | High | High |
| Agent-friendliness | Good with schemas/scripts | Good | Good after migration | Good |

**Recommendation:** stay on Hugo + Blowfish for production. Prototype Astro only behind **GATE-3** if a measured capability gap appears.

## 9. Agent Architecture

| Agent | Responsibility | Inputs | Outputs | Allowed | Forbidden | Checks | Handoff / rollback |
|---|---|---|---|---|---|---|---|
| Strategic Orchestrator | Scope, gates, sequencing | Issue, docs, audit | Plan, gate list | Read/write docs/tasks | Direct destructive code changes | Verify evidence labels | Handoff YAML; rollback by reverting planning PR |
| Discovery Agent | Inventory and facts | Repo, CI, git, commands | FACT/UNKNOWN matrix | Read, run safe commands | Make changes | `git status`, builds/tests as needed | Evidence log |
| Architecture Agent | Current/target architecture | Discovery output | ADR proposals | Docs/ADR drafts | Change SSG/deploy alone | Human gate required | ADR rollback = revert doc |
| Content Agent | Posts/frontmatter/taxonomy | Content schema, drafts | Valid content PR | Edit content | Publish without approval | schema, links, AI review | Alias/URL rollback |
| QA/Test Agent | Test coverage/gates | Code diff | Test results, new tests | Add/fix tests | Lower gates silently | lint, jest, hardhat, e2e | Revert test PR |
| Security Agent | Threat model and controls | Workflows/deps/scripts | Findings and patches | Harden permissions/pins | Expose secrets, deploy contracts | audit, Semgrep/Trivy | Revert workflow/deps |
| DevOps Agent | CI/deploy reliability | Workflows/config | CI PRs | CI edits | Change publisher without gate | dry-run/build | Revert workflow commit |
| Performance Agent | CWV/assets | Built site/reports | Budgets/fixes | Optimize assets | Rewrite stack without evidence | Lighthouse, size scripts | Revert asset/config |
| Review Agent | Independent verification | PR diff/results | Review report | Comment/request changes | Self-approve irreversible work | Re-run critical checks | Human gate |

## 10. Planning Stack

Minimal non-conflicting ownership:

- Architecture → `docs/adr/`.
- Requirements/specifications → `.specify/` and `.openspec/changes/<initiative>/`.
- Strategic roadmap/status → `docs/ROADMAP_STATUS.md` or its successor in `docs/roadmap/`.
- Governance/WHY → `.planning/CHARTER.md` plus initiative charters.
- Execution plan/evidence → `.gsd/plan.md`.
- Tasks/status graph → `.beads/beads.json`.
- Operational runbooks → `docs/OPERATIONS.md`, `docs/PUBLISHING.md`, `docs/TESTING.md`, `docs/CONTENT_CONTRACT.md`.

Rule: do not duplicate status in prose if Beads is active; prose should link to Beads and summarize only.

## 11. Phased Roadmap

| Phase | Goal | Definition of Done |
|---|---|---|
| 0 Baseline | Capture reproducible current state. | Build status recorded; test counts; coverage; dependency audit; content counts; links; RSS/sitemap; unresolved UNKNOWNs listed. |
| 1 Consolidation | Remove contradictions. | Stale docs marked; stale workflows fixed/disabled; one source per information type. |
| 2 Reliability | Harden CI/tests. | `quality.yml` required; build/test/link/schema pass; quarantined tests have owners/issues. |
| 3 Performance | Measure then optimize. | Lighthouse baseline stored; JS/CSS/image budgets set from current measurements; regressions fail where stable. |
| 4 Security | Least privilege and supply chain. | Workflow permissions minimized; npm audit triaged; secret-requiring jobs guarded; dependency policy documented. |
| 5 Content Engineering | Improve schema/taxonomy/KG. | New posts validate; taxonomy report; KG/RSS/sitemap validated; duplicate and canonical checks. |
| 6 Agentic Publishing | Safe PR-based content automation. | Agent post PR template, required checks, fact-check handoff, human publish gate. |
| 7 Search | Classical → hybrid only if needed. | Fuse payload measured; lazy loading confirmed; vector search only with measured need. |
| 8 UX | Accessibility/navigation improvements. | axe critical = 0 on representative pages; keyboard paths documented; responsive smoke tests. |
| 9 Observability | Build and runtime visibility. | Build metrics artifacts; live smoke checks; CWV/RUM policy and privacy notes. |
| 10 Advanced R&D | Promote experiments carefully. | Promotion checklist, ADR, rollback, independent review; no accidental production inclusion. |

## 12. Task Graph

Core dependencies:

```text
TASK-001 Baseline
  ↓
TASK-002 Tooling bootstrap ──→ TASK-004 Workflow cleanup
  ↓                         ↓
TASK-003 Docs reconciliation ─→ TASK-005 CI hardening
  ↓                         ↓
TASK-006 Security triage ─────→ TASK-007 Performance baseline
  ↓                         ↓
TASK-008 Content pipeline ────→ TASK-009 Agent publishing protocol
  ↓
TASK-010 Search/UX/observability evolution
```

Parallelizable after TASK-001: documentation reconciliation, security triage, content taxonomy audit, and test quarantine audit.

## 13. CI/CD Evolution

Current pipeline:

```text
commit → PR quality.yml/e2e/performance/security → merge to main → hugo.yml sync/validate/build/upload/deploy → analytics/performance monitors
```

Target evolution:

1. Add reproducible Hugo bootstrap for agents.
2. Make `quality.yml` the required PR gate.
3. Fix or disable stale dependency and gist workflows.
4. Enforce content contract in every publisher/preview path.
5. Move report-only checks to hard gates only after false positives are eliminated.
6. Add post-deploy smoke validation with stable URLs.

## 14. Content Engineering Pipeline

```text
Idea → Research → Draft → AI Review → Fact Check → Metadata Validation → Link Validation → SEO Validation → Accessibility Validation → Human Review → Merge → Build → Deploy → Post-deploy verification
```

Controls:

- JSON Schema remains single source for post metadata.
- Add duplicate title/slug detection.
- Validate canonical URL/aliases for migrated posts.
- Validate taxonomy against allowed categories/tags and editorial strategy.
- Generate JSON-LD KG, RSS, sitemap, OG/social cards.
- Use external link check as warning until flakiness is understood.

## 15. Agentic Publishing Protocol

Agent may open PR, but not publish without human approval:

```text
POST draft → frontmatter schema → content lint → fact-check notes → link-check → SEO/OG check → KG generation → AI review → Hugo build → preview artifact → human approval → merge/deploy
```

Human gate is mandatory for dates, claims, URL/permalink changes, sponsored/affiliate claims, and publication timing.

## 16. Security Architecture

Threat model:

| Surface | Threat | Control |
|---|---|---|
| GitHub Actions | Overbroad tokens, stale third-party actions | `permissions: contents: read` by default; pin actions; review scheduled writers. |
| Secrets | DAO/Fediverse/API leakage | Never echo secrets; deploy jobs guarded; PRs never get deploy secrets. |
| npm deps | Dev tooling vulnerabilities | Triage audit; lockfile; reduce unused deps; Dependabot with passing build command. |
| Submodule | Theme supply chain | Pin commit; update via PR; build smoke and visual/a11y checks. |
| External scripts | giscus/Buttondown/Firebase | CSP plan; document privacy; keep scripts minimal. |
| Generated content | XSS/link injection from GitHub README/gists | Sanitize/escape generated Markdown/HTML; link rewrite; internal link checks. |
| AI content | Prompt injection/fabricated facts | Treat content as untrusted; require source citations/fact-check log. |
| Deployment | Dual publishers diverge | One canonical publisher or identical gates across all. |

## 17. Performance Strategy

Baseline before optimization:

| Metric | Current value |
|---|---|
| Build time | UNKNOWN — local build blocked by missing Hugo. |
| Bundle sizes | UNKNOWN locally; analytics workflow extracts live JS/CSS sizes. |
| JS/CSS/image sizes | UNKNOWN — requires successful build artifact. |
| LCP/INP/CLS/TTFB | UNKNOWN locally; Lighthouse CI has configured budgets. |
| Accessibility | UNKNOWN locally until build; script requires `public/`. |
| SEO/best practices | UNKNOWN locally; Lighthouse CI covers live URL. |
| Coverage | FACT: local Jest coverage output all files 77.44 statements / 65.41 branch / 70.8 functions / 78.94 lines for measured subset. |
| Test count | FACT: 273 Jest + 9 Hardhat passed locally. |
| Broken links | UNKNOWN locally until Hugo build. |
| Content count | FACT: 59 blog markdown files, 101 gist markdown files. |
| Languages | FACT: ru/en Hugo i18n files. |
| RSS/sitemap validity | UNKNOWN locally until build. |
| Security findings | FACT: npm audit total 42, critical 0. |
| Dependency state | FACT: lockfile present; no remote/submodule initialized locally. |

Process: measure first, set budgets from p75/current stable CI data, optimize only known bottlenecks, then hard-gate regressions.

## 18. SEO / Accessibility

- Keep dated permalinks and aliases stable; changes require **GATE-4**.
- Validate sitemap/RSS after every build.
- Maintain default OG raster image and per-post alt text.
- Use axe/Playwright representative page set before making a11y checks hard.
- Preserve keyboard navigation for search and knowledge graph.

## 19. Search Strategy

- **Current production:** Blowfish search with Fuse.js and Hugo JSON output.
- **Current KG:** `/data/knowledge-graph.json` feeds the knowledge graph widget.
- **R&D:** `src/modules/search-engine.js` includes Lunr/vector/fallback logic; not a production dependency unless explicitly wired.
- **Next:** measure `index.json` and search JS size; lazy-load if payload affects LCP/TTI.
- **Only later:** hybrid/semantic search if queries/content volume justify it; no vector DB or AI API until measurable need and privacy/security design exist.

## 20. Documentation Strategy

Canonical tree should evolve without duplication:

```text
docs/
├── adr/                 # irreversible decisions
├── architecture/        # current architecture maps (may start by moving ARCHITECTURE.md)
├── agents/              # agent roles/protocols
├── content/             # content contract, editorial strategy, taxonomy
├── operations/          # deployment, RUM, runbooks
├── security/            # threat model, dependency policy
├── testing/             # test strategy and quarantine register
└── roadmap/             # roadmap status and phase plans
```

Keep migration plans as historical records; current state belongs in roadmap/architecture docs.

## 21. Git / PR Strategy

```text
main
├── feature/*
├── chore/*
├── fix/*
├── docs/*
└── experiment/*
```

Rules: one logical change per PR; destructive changes require human gate; R&D promotion requires ADR; no mixed refactor+feature unless necessary; all PRs include commands and evidence; rollback is `git revert` unless a migration playbook says otherwise.

## 22. Metrics / KPIs

- Build: pass/fail, duration, artifact size.
- Tests: Jest count, Hardhat count, E2E count, quarantined test count.
- Coverage: no regression below established R&D baseline unless accepted by human.
- Security: critical npm findings = 0; all high findings triaged.
- Content: schema pass, broken internal links = 0, external link trend.
- Performance: Lighthouse scores and CWV against measured budgets.
- SEO: sitemap/RSS/OG presence, canonical URL checks.
- Agent ops: PR cycle time, failed-check rate, rollback count, human gate violations = 0.

## 23. First 10 Actions

1. Install or provision Hugo 0.164.0 for agents and document the exact bootstrap.
2. Re-run full local baseline: build, links, HTML, a11y, OG, RSS/sitemap, size.
3. Fix/disable `dependency-update.yml` stale Ruby/Jekyll flow.
4. Decide Vercel role: canonical preview or disabled; ensure same gates as Pages.
5. Retire/rewrite `sync_gists.yml` to avoid parallel gist source paths.
6. Mark `docs/STRATEGIC_PLAN_2026-2027.md` superseded and update strategy index.
7. Create test quarantine register with owners and repair order.
8. Triage npm audit high/moderate findings.
9. Add content publishing PR template/checklist.
10. Add agent handoff template and human gate policy.

## 24. 30 / 60 / 90 Day Plan

- **30 days:** baseline reproducible; stale workflows resolved; docs source-of-truth map published; audit findings triaged.
- **60 days:** CI gates stable; quarantined critical tests repaired; content pipeline templates active; performance/security budgets based on data.
- **90 days:** agentic publishing PR protocol operational; observability reports archived; search payload optimized if measured; R&D promotion policy enforced.

## 25. Long-Term Roadmap

- **6 months:** mature content engineering, reliable CI, no stale deploy paths, routine agent PRs for safe maintenance.
- **12 months:** measured UX/search improvements, automated link/taxonomy health, stable RUM/privacy posture.
- **18 months:** selective R&D promotion only where user value is proven; no full rewrite unless Hugo has demonstrably failed target requirements.

## Human Gates

- **GATE-1:** architecture changes.
- **GATE-2:** deletion of production or R&D components.
- **GATE-3:** SSG change.
- **GATE-4:** URL/content model changes.
- **GATE-5:** deployment changes.
- **GATE-6:** security policy changes.
- **GATE-7:** publication.
- **GATE-8:** irreversible migration.

# AGENT EXECUTION PLAN

```yaml
- id: TASK-001
  title: Reproducible baseline audit
  priority: P0
  owner_agent: Discovery Agent
  depends_on: []
  scope: repo-wide measurement
  files: [docs/BASELINE_METRICS.md]
  commands: ["npm ci", "npm run lint", "npm test", "npx hardhat test", "npm run build", "node scripts/check-links.cjs"]
  verification: all commands recorded with pass/fail and environment notes
  definition_of_done: baseline table contains no invented metrics; UNKNOWNs have next action
  risk: missing local Hugo or submodule blocks build
  rollback: revert docs-only baseline commit
  human_approval_required: false

- id: TASK-002
  title: Agent Hugo/tooling bootstrap
  priority: P0
  owner_agent: DevOps Agent
  depends_on: [TASK-001]
  scope: local and CI parity
  files: [docs/OPERATIONS.md, README.md, package.json]
  commands: ["command -v hugo", "hugo version", "npm run build"]
  verification: fresh checkout can build with documented steps
  definition_of_done: agent can run Hugo 0.164.0 without manual guessing
  risk: toolchain drift
  rollback: revert bootstrap script/docs
  human_approval_required: false

- id: TASK-003
  title: Documentation source-of-truth consolidation
  priority: P1
  owner_agent: Documentation Agent
  depends_on: [TASK-001]
  scope: docs/planning reconciliation
  files: [docs/STRATEGY_INDEX.md, docs/ROADMAP_STATUS.md, docs/adr/]
  commands: ["rg -n 'Jekyll|jekyll|bundle exec|build:test|_posts|_site' docs .github README.md AGENTS.md"]
  verification: contradictions table updated
  definition_of_done: stale docs are marked historical/superseded, not used as active plan
  risk: deleting useful historical context
  rollback: git revert docs changes
  human_approval_required: true

- id: TASK-004
  title: Workflow cleanup for stale automations
  priority: P1
  owner_agent: DevOps Agent
  depends_on: [TASK-001, TASK-003]
  scope: GitHub Actions
  files: [.github/workflows/dependency-update.yml, .github/workflows/sync_gists.yml, .github/workflows/fediverse-notify.yml, vercel.json]
  commands: ["npm run build", "node scripts/ci-content-contract.cjs"]
  verification: no workflow invokes removed Jekyll/Ruby publishing steps
  definition_of_done: all publishers/previews use equivalent gates or are disabled
  risk: changing deployment behavior
  rollback: revert workflow PR
  human_approval_required: true

- id: TASK-005
  title: Test quarantine repair plan
  priority: P2
  owner_agent: QA/Test Agent
  depends_on: [TASK-001]
  scope: tests and jest config
  files: [jest.config.js, tests/, docs/TESTING.md]
  commands: ["npx jest --config jest.config.js --coverage=false", "npm run test:coverage"]
  verification: each quarantined suite has owner, issue, and repair PR order
  definition_of_done: no hidden failing suite; gate remains deterministic
  risk: flaky test churn
  rollback: restore previous quarantine list
  human_approval_required: false

- id: TASK-006
  title: Security dependency and workflow triage
  priority: P1
  owner_agent: Security Agent
  depends_on: [TASK-001]
  scope: dependency and Actions threat model
  files: [docs/security/dependency-policy.md, .github/workflows/security.yml, package-lock.json]
  commands: ["npm audit --json", "rg -n 'permissions:|secrets\.|curl|uses:' .github/workflows scripts"]
  verification: high/moderate findings classified dev/prod/exploitable
  definition_of_done: critical=0, high findings have mitigation or accepted risk
  risk: major dependency upgrades break tooling
  rollback: lockfile/workflow revert
  human_approval_required: true

- id: TASK-007
  title: Performance baseline and budgets
  priority: P2
  owner_agent: Performance Agent
  depends_on: [TASK-002]
  scope: built site metrics
  files: [docs/PERFORMANCE.md, .lighthouserc.json]
  commands: ["npm run build", "npm run analyze:size", "node scripts/check-perf.cjs"]
  verification: metrics captured from successful build or CI artifact
  definition_of_done: budgets are derived from measured baseline and documented
  risk: noisy Lighthouse results
  rollback: revert budget changes
  human_approval_required: false

- id: TASK-008
  title: Content publishing checklist and schema extensions
  priority: P2
  owner_agent: Content Agent
  depends_on: [TASK-003]
  scope: content workflow
  files: [docs/CONTENT_CONTRACT.md, .github/pull_request_template.md, schema/post-metadata.schema.json]
  commands: ["node scripts/validate-frontmatter.cjs content/blog/<post>.md", "node scripts/ci-content-contract.cjs"]
  verification: sample new post PR path is documented
  definition_of_done: agents can open but not publish a post without human gate
  risk: overstrict schema blocks legacy content
  rollback: revert schema/template changes
  human_approval_required: true

- id: TASK-009
  title: Agent handoff protocol
  priority: P2
  owner_agent: Strategic Orchestrator
  depends_on: [TASK-003, TASK-008]
  scope: agent operations
  files: [docs/agents/]
  commands: ["rg -n 'human_approval_required|GATE-' docs .planning .specify .gsd .beads"]
  verification: every agent role has scope, forbidden ops, checks, rollback
  definition_of_done: PRs include structured handoff and gate declarations
  risk: process overhead
  rollback: revert docs-only change
  human_approval_required: false

- id: TASK-010
  title: Search and knowledge graph payload audit
  priority: P3
  owner_agent: Performance Agent
  depends_on: [TASK-007]
  scope: search/KG runtime
  files: [layouts/partials/head.html, static/js/knowledge-graph.js, docs/PERFORMANCE.md]
  commands: ["npm run build", "find public -name '*index*.json' -o -name '*.js' -exec wc -c {} +"]
  verification: payload sizes and load timing documented
  definition_of_done: lazy-load recommendation is evidence-based
  risk: premature semantic-search work
  rollback: revert docs/code changes
  human_approval_required: false
```

Dependency graph:

```text
TASK-001
  ↓
TASK-002 ─────────→ TASK-007 ─────────→ TASK-010
  ↓                  ↑
TASK-003 ─→ TASK-004 │
  ↓                  │
TASK-008 ─→ TASK-009 │

TASK-006 can run after TASK-001 in parallel with TASK-003/TASK-005.
TASK-005 can run after TASK-001 in parallel with documentation and security triage.
```
