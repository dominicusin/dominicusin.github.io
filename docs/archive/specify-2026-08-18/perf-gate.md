# Spec — Performance smoke gate (check-perf)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/perf-gate.md`.

## Context
Perf fixes #111 (defer JS) and #112 (non-blocking CSS) are unguarded against
regression. CI Lighthouse is non-blocking + noisy, so it can't protect them. We
automate the structural audit of the built homepage as a CI gate.

## Requirements
- **R1** New `scripts/check-perf.cjs` parses the built `public/index.html`.
- **R2** Fails (exit non-zero) if any `<script src=...>` in `<head>` lacks
  `defer`/`async` (render-blocking executable JS regression). Inline non-executable
  scripts (`type=application/json`, `type=application/ld+json`, or empty body) are
  exempt.
- **R3** Fails if the main CSS bundle `<link>` is a plain render-blocking
  `rel=stylesheet` (i.e. not `rel=preload as=style` with onload swap, not
  `media=print onload`, not inside a non-blocking pattern). The #112 fix must hold.
- **R4** Reports (non-failing) the CSS bundle byte size; warns if > threshold
  (140KB) — informational only.
- **R5** Wired into `.github/workflows/hugo.yml` as a "Performance smoke check"
  step after the Hugo build, **report-only** (does not block required gates).
- **R6** Safety: `hugo` 0 errors; `npm run lint` clean; `npm run test` pass;
  `check-links` 0 broken.

## Acceptance (measurable)
- Script exits 0 on the current built site (no regressions present).
- Script exits non-zero when a blocking `<script>`/`rel=stylesheet` is injected
  (verified by a temporary negative test during dev, then reverted).
- CI step runs and reports on PRs without breaking required gates.

## Out of scope
- Real Lighthouse/Chrome run; page-scoped CSS splitting; appearance/feature change.
