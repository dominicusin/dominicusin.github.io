# Spec — Performance (LCP / above-the-fold)

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/performance.md`.

## Context
CI Lighthouse (non-blocking) reports LCP ≈5.8s and perf-score ≈0.64 on the
homepage and /blog/. Root-cause the above-the-fold bottleneck and fix it.

## Requirements
- **R1** Audit the built site and identify the LCP element / critical-path
  bottleneck (heavy hero image, render-blocking JS/CSS, large inline script).
  Record measurements (asset byte sizes, what blocks first paint).
- **R2** Non-critical JS (search modal, knowledge-graph/D3, any analytics) is
  deferred (`defer` or lazy-initialized) so it does not block first paint.
  Build still 0 errors; no broken functionality.
- **R3** Above-the-fold / critical CSS is not render-blocking where avoidable;
  total critical-path CSS+JS budget is reduced vs. baseline (measure before/after).
- **R4** If a hero/above-the-fold image is the LCP element, it is optimized
  (responsive `sizes`/`srcset` or smaller format) — only if root cause is images.
- **R5** Reproduction safety: `hugo --gc --minify` exits 0; `npm run lint` clean;
  `npm run test` passes; `node scripts/check-links.cjs` reports 0 broken.

## Acceptance (measurable)
- A before/after measurement table exists (bundle sizes, deferred scripts).
- Lighthouse `largest-contentful-paint` ≤ 2500ms **OR** improved ≥ 40% from
  baseline (~5790ms) on a representative page.
- Lighthouse `categories.performance` ≥ 0.9 **OR** improved ≥ 0.2 from baseline
  (~0.64). (Lighthouse on shared infra is noisy; the ≥40%/≥0.2 deltas are the
  binding targets, with the absolute thresholds as stretch.)
- Critical JS no longer in the render-blocking path (verified by build analysis).

## Out of scope
- Content-ingest pipeline (sync/KG/ontology/crosslinks).
- Hosting / SSG change.
