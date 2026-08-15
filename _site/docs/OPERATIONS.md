# Operations — Branch Protection, Rollback & Strangler-Fig

Reference for safe production changes (plan Phase 7).

## Branch protection (enforced 2026-08-15)
- `main` is **protected**: `gh api .../branches/main/protection`
  - Required status checks: `test` (lint + jest in CI/CD Pipeline), `build`.
  - `allow_force_pushes: false`, `allow_deletions: false`.
  - `enforce_admins: false` — repository admins may still push directly /
    revert in an emergency (deliberate: avoids self-lockout; the human owner
    retains break-glass).
- Effect: PRs cannot merge with a red `test`/`build`. Direct admin pushes
  bypass the check gate by design.

## Rollback procedure (verified design)
1. **Code rollback (preferred):** `git revert <bad-sha>` on `main`, push.
   Reverting is a fast-forward and works even with protection on.
2. **Hotfix to last-known-good:** tag good releases
   (`git tag -a v2.0.0-<date> <sha>`); to redeploy a prior build, check out
   the tag and redeploy via the existing `Deploy Jekyll site to Pages` action
   (dispatch on the tag ref).
3. **Content-only incident:** revert the offending post/collection commit the
   same way; Jekyll rebuilds automatically.
4. **Contract/DAO incident:** the `Deploy DAO to Sepolia` job is **fail-safe by
   design** — it errors loudly when `DEPLOY_PRIVATE_KEY`/`SEPOLIA_RPC_URL`
   secrets are absent and never fabricates a deployment. Rollback = remove the
   bad proposal on-chain via the existing `ProposalEngine` (no owner can
   unilaterally execute; `TIMELOCK` = 2 days gives a window to counter).

## Strangler-Fig: legacy `js/*.js` → `js/refactored-bundle.js` (plan Phase 7)
Status: **defined, not yet applied** (behavior-affecting → human sign-off).
- The legacy `js/*.js` (non-module `<script defer>`) and the esbuild
  `js/refactored-bundle.js` both load today. Verified duplication (AUDIT §B1).
- Exit criteria before removing legacy files:
  1. Add a single feature flag (e.g. `window.__USE_LEGACY_JS__` defaulting to
     `false`) read by `_layouts/default.html`; when `false`, only the module
     bundle loads.
  2. Measure real usage of legacy globals (`window.App`, `window.i18n`, …) over
     a 2-week window via `analytics-service`; require **0% legacy reliance**.
  3. Remove legacy `js/*.js` in a dedicated PR gated by this protection.
- This is intentionally deferred: removing legacy JS without the flag + usage
  measurement risks breaking the live site, which the plan explicitly gates
  behind human approval.

## Open human-gated items
- Dead code `src/services/embedding-cache.js` (v3.0, 561 LOC) — confirm unused,
  then delete in its own PR.
- Legacy dual JS pipeline removal (above).
- Reaching ≥85% branch coverage needs the Phase 4.4 Playwright E2E layer.
