# BMAD — Initiative: `doc-debt`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Source: user-supplied backlog "doc-debt-and-hardening" (Initiative 6+), executed
> autonomously. State → Beads. GSD. Contract → Spec Kit.

## Why (reasoning — measured against reality, not blindly followed)
User supplied a detailed Beads/GSD-shaped backlog. Audited it against the repo
BEFORE acting (honesty rule). Findings:
- **Phase 0 (T29/T30) is ALREADY DONE** — `scripts/check-perf.cjs` (negative test:
  fails on injected blocking script) landed in PR #113 (`e4334ffee`). The Beads
  graph was just out of sync (T29 in_progress / T30 pending). Action: reconcile
  graph to truth, not re-do work.
- **Phase 1.2 is valid**: `STRATEGY_INDEX.md` "Archived/superseded" table lacks
  `RECOMMENDATIONS.md` and `Manifest.md`. BUT they live in repo ROOT, not `docs/`
  (plan mis-stated the path). Will add them to the index as archived (Jekyll-era).
- **Phase 1.3 / 1.4 are HUMAN-GATED** (AGENTS.md: "no deletion without commit +
  reason"): deleting `RECOMMENDATIONS.md` and removing `.bolt/` need user
  confirmation. `.bolt/mcp.json` shows notion/linear/miro `enabled:true` — a config
  artifact, NOT proof of active use. Will NOT delete; flag for user decision.
- **Phase 2 (package.json prune)** was previously assessed NOT viable (transitive
  deps under jest/hardhat/eslint/tailwind/lighthouse). Plan's "split content-tooling
  vs legacy" is plausible only if no shared transitive deps — will re-verify before
  acting; likely limited to removing dead `_site/`/`.bundle/`/vendor scripts.
- **Phase 3 (publisher-gate)** is the real risk: `hugo.yml` already runs
  `ci-content-contract.cjs` (soft gate), but `vercel.json` exists with NO Vercel
  GitHub Actions workflow — so Vercel can auto-deploy on git-push, BYPASSING the
  Pages content-contract. Closing this needs a careful, separate PR (vercel.json
  `ignoreCommand` calling the contract, or Vercel → preview-only). High deploy-break
  risk → isolated PR, thorough check.
- **Phase 4 (Playwright coverage)** is large but mechanical; do incrementally.
- **Phase 5/6** editorial/periodic — low risk, some need human editorial input.

## Shape (locked decisions)
1. Phase 0: reconcile Beads T29/T30 → done (evidence: PR #113). GSD note.
2. Phase 1: add RECOMMENDATIONS.md + Manifest.md to STRATEGY_INDEX archived table
   (root paths). Do NOT delete files (human-gated). Note `.bolt/` D2 needs user.
3. Phase 3: separate PR — wire vercel.json to the content-contract (or preview-only)
   so no pipeline publishes invalid posts. Verify deploy still works.
4. Phase 2/4/5/6: verify-then-act, incremental PRs, each with GSD evidence.

## Out of scope (human-gated, do NOT act without confirmation)
- Deleting RECOMMENDATIONS.md.
- Removing `.bolt/` (D2).

## Handoff
- → Spec Kit `.specify/doc-debt.md`.
- → Beads `.beads/beads.json`: T29/T30 reconcile + T57–T6x.
- → GSD `.gsd/plan.md`: Phase P (doc-debt).
