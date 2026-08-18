# Spec — doc-debt-and-hardening (Initiative 6+)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/doc-debt.md`.

## Context
User-supplied backlog across 7 phases (0–6). Audited against repo: Phase 0 already
done (PR #113); Phase 1.2 valid; Phase 1.3/1.4 human-gated (no deletion without
confirm); Phase 3 is the real publish-risk (Vercel bypasses Pages content-contract).

## Requirements (phased)
- **R0** Beads T29/T30 → `done` (reconcile; work shipped in PR #113 e4334ffee).
- **R1** `docs/STRATEGY_INDEX.md` "Archived/superseded" table gains rows for
  `RECOMMENDATIONS.md` and `Manifest.md` (repo-root paths; reason: Jekyll-era,
  superseded by Hugo two-plane strategy). NO file deletion.
- **R1b** `docs/AUDIT_FINDINGS.md` D2 marked: `.bolt/` removal BLOCKED pending user
  confirmation (config shows notion/linear/miro enabled — not proof of use).
- **R3** Vercel pipeline cannot publish invalid posts: either `vercel.json`
  `ignoreCommand` invokes `scripts/ci-content-contract.cjs`, or Vercel set to
  preview-only. Verify Pages still deploys; verify invalid post is blocked on the
  Vercel path. Separate, careful PR.
- **R2** `package.json` dead scripts referencing `_site/`, `.bundle/`, `vendor/bundle/`
  removed; only if no shared transitive-dep breakage (re-verify). Report npm ci delta.
- **R4** Playwright fixtures for zero-coverage DOM/network modules (rum-service,
  vr-export-service, image-optimizer, social-sharing, vector-search-service,
  pwa-service, src/agents/link-repair-agent). Increment branch coverage toward 85%.
- **R5** i18n ru/en parity audit; backfill tags on legacy posts; first deep-dive
  series (3–5 posts) — editorial, some human input.
- **R6** ROADMAP_STATUS.md reconciled with Beads graph (single source of truth).

## Acceptance (measurable per PR)
- R0: T29/T30 done in beads + GSD note citing #113.
- R1: STRATEGY_INDEX lists both files as archived; `git` shows files UNCHANGED.
- R3: invalid-post push to Vercel path is blocked; Pages deploy green.
- R2: `npm run precommit` passes; node_modules delta recorded.
- R4: branch coverage % recorded in BASELINE_METRICS per PR, never below baseline.

## Out of scope (human-gated)
- Deleting RECOMMENDATIONS.md; removing `.bolt/`.
