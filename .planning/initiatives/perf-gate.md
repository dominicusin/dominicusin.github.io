# BMAD — Initiative: `perf-gate`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Contract → Spec Kit (`.specify/perf-gate.md`). State → Beads. Execution → GSD.

## Why (reasoning)
The CI Lighthouse Performance job is **non-blocking and noisy** (throttled shared
infra; perf 0.64–0.68, LCP 5.5s across runs) — it cannot gate merges and its
numbers aren't reliably actionable. Meanwhile the real, verified perf fixes
(#111 deferred JS, #112 non-blocking CSS) are **unguarded**: a future edit could
silently re-introduce a render-blocking `<script>` or a blocking CSS `<link>` and
we'd only notice via the flaky Lighthouse job (or not at all).

We already *manually* audit the built `<head>` for render-blocking resources. The
right move is to **automate that audit as a CI gate** (mirroring the existing
`scripts/check-links.cjs` pattern): parse the built `public/index.html` and fail
if a render-blocking resource regresses. This makes the perf signal locally
actionable (no Chrome needed) and protects the #111/#112 wins.

## Shape (locked decisions)
1. **New script `scripts/check-perf.cjs`** (ESM/CJS consistent with repo:
   `package.json` is `type:module`, so use `.cjs` like other scripts). Inputs:
   the built `public/index.html` (homepage is the LCP-critical page). Checks:
   a. **No render-blocking `<script>`** in `<head>` — i.e. every `<script>` with
      a `src` MUST have `defer` or `async` (inline non-JS scripts like JSON-LD /
      firebase-config are exempt: they're `type=application/json` or have no
      executable body).
   b. **CSS is non-render-blocking** — the main bundle `<link>` must use
      `rel=preload as=style` (with onload swap) or `media=print onload`, OR be
      wrapped so it does not block first paint. A plain `rel=stylesheet` for the
      main bundle is a regression.
   c. (Optional, soft) report the CSS bundle byte size; warn if it grows beyond a
      threshold (e.g. >140KB) — informational, not failing.
2. **Wire into CI** `hugo.yml` as a "Performance smoke check" step AFTER the Hugo
   build, **report-only first** (like `check-links.cjs` is report-only on PR), so
   it surfaces regressions without blocking the required gates. Can be promoted to
   a hard gate later once stable.
3. **Scope**: homepage only (`public/index.html`) — it is the LCP-critical,
   highest-traffic page and the one Lighthouse flags. Blog/list pages inherit the
   same `<head>` so they're covered transitively.
4. **Graceful**: script exits non-zero ONLY on a real regression (blocking script
   or blocking CSS). No behavior change to the site. Build/lint/test/linkcheck
   stay green.

## Out of scope
- Running a real Lighthouse/Chrome locally (no binary in this env) — the smoke
  check is structural, complementary to CI Lighthouse, not a replacement.
- Splitting KG/repo/gist CSS into page-scoped bundles (component CSS; not viable
  without forking Blowfish — recorded as principled limit in `performance` init).
- Changing the site's appearance or features.

## Handoff
- → Spec Kit `.specify/perf-gate.md`: R1–Rn + acceptance.
- → Beads `.beads/beads.json`: T29–T32.
- → GSD `.gsd/plan.md`: execution + evidence.
