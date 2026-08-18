# Spec — Fix catastrophic CLS (render-blocking CSS revert)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/cls-fix.md`.

## Context
Lighthouse CI reports `cumulative-layout-shift` = **1.0** (max) on the deployed
homepage. Root cause: PR #112 made the CSS bundle non-render-blocking
(`rel=preload as=style onload="this.rel='stylesheet'"`). The page painted
UNSTYLED first, then snapped into the styled layout → full-viewport shift = CLS 1.0.
A render-blocking `rel=stylesheet` does not cause CLS (content waits for styles).

## Requirements
- **R1** `layouts/partials/head.html` loads the CSS bundle as `<link rel="stylesheet">`
  (render-blocking). No `rel=preload as=style` + onload swap; no `<noscript>`
  fallback needed for it.
- **R2** JS stays deferred (`defer` on appearance/a11y/zenMode/zoom + `type=module`
  firebase + deferred main bundle) — PR #111 retained.
- **R3** `scripts/check-perf.cjs`: a render-blocking `<link rel=stylesheet>` is NOT
  a failure (informational only); the gate still fails on a render-blocking
  executable `<script>` in `<head>`.
- **R4** Built `public/index.html` head has `<link rel="stylesheet" href="…main.bundle…">`
  and NO `rel=preload as=style … onload=`.
- **R5** Safety: `hugo` 0 errors; lint clean; test pass; check-links 0 broken;
  check-perf 0 regressions.

## Acceptance (measurable)
- `grep` of built head: `rel=stylesheet` for the bundle, no `onload=…rel=` swap.
- `node scripts/check-perf.cjs` exits 0; reports CSS blocking as intentional.
- `hugo` 0 errors; lint/test/linkcheck green.

## Out of scope
- Trimming 128KB CSS (already-purged component CSS). Separate JS errors
  (`mediumZoom`, vercel 404).
