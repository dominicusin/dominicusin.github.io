# Agent Risk Policy — `dominicusin.github.io`

> **Risk levels и соответствующие политики автономии**

## Risk Matrix

### R0 — Documentation / Content Metadata
- **Scope:** `.md` файлы, frontmatter, README, docs, editorial content
- **Autonomy:** Full autonomous
- **Verification:** `npm run content-contract`
- **Gate:** Hard gate on new posts
- **Rollback:** Git revert (no external state)

### R1 — Isolated Code / Tests
- **Scope:** `layouts/`, `assets/`, `scripts/`, `tests/` (single area)
- **Autonomy:** Full autonomous + CI
- **Verification:** `npm run lint && npm test && hugo --gc --minify`
- **Gate:** PR + CI green
- **Rollback:** Git revert + re-deploy

### R2 — Architecture / Dependencies
- **Scope:** Cross-cutting changes, new deps, ADR modifications
- **Autonomy:** Autonomous + review
- **Verification:** All R1 + dependency review + architectural drift check
- **Gate:** PR + CI + human review (CODEOWNERS)
- **Rollback:** Git revert + dependency rollback

### R3 — CI / Deployment Configuration
- **Scope:** `.github/workflows/`, `vercel.json`, deploy scripts
- **Autonomy:** Autonomous + strict gates
- **Verification:** CI runs on PR + manual verification
- **Gate:** PR + CI + admin merge
- **Rollback:** Workflow revert + manual intervention

### R4 — Secrets / Infrastructure / Production
- **Scope:** Secrets, DAO mainnet, IPFS credentials, production deploys
- **Autonomy:** Human approval required
- **Verification:** Manual verification + evidence
- **Gate:** Human approval + admin merge
- **Rollback:** Manual rollback procedure

## Decision Tree

```
Is it content/docs only?
  YES → R0 → autonomous
  NO ↓

Does it touch CI, secrets, or production infrastructure?
  YES → R4 → human approval
  NO ↓

Does it modify dependencies or cross architectural boundaries?
  YES → R2 → review required
  NO ↓

Does it modify deploy workflows or GitHub Actions?
  YES → R3 → strict gates
  NO ↓

Is it isolated to one area with tests?
  YES → R1 → autonomous + CI
  NO → R2 → review required
```
