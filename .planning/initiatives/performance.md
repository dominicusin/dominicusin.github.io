# BMAD — Initiative: `performance`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Contract → Spec Kit (`.specify/performance.md`). State → Beads. Execution → GSD.

## Why (reasoning)
The CI pipeline's Lighthouse Performance Audit (non-blocking job, but a real
production signal) systematically fails on `https://dominicusin.github.io/` and
`/blog/`:
- `largest-contentful-paint` expected ≤2500ms, **found 5790ms** (PR #110 run)
- `categories.performance` expected ≥0.9, **found 0.64**
- `first-contentful-paint` ~4900ms, `time-to-interactive` ~5800ms

This is a recurring, data-driven signal from our own build infra — not a
fabricated goal. A 5.8s LCP on a mostly-static Hugo site is abnormal and points
to a concrete above-the-fold bottleneck (heavy hero asset, render-blocking
JS/CSS, or a large inline script). Improving it is squarely in scope for
"stabilize Hugo as the sole prod path" and makes the site genuinely usable.

## Shape (locked decisions)
1. **Measure, don't guess.** Audit the built site: bundle sizes of JS/CSS,
   hero/above-the-fold images, render-blocking resources, and any large inline
   script (D3 vendored 280KB, knowledge-graph.js, etc.). Root-cause the LCP
   element before changing anything.
2. **Scope = above-the-fold / critical path only.** Do NOT touch the
   content-ingest pipeline (sync-github, KG, ontology-feed, cross-links) — those
   are unrelated and already verified. Performance work is isolated to theme
   assets + page shell.
3. **Preferred levers (in order):**
   a. Lazy-load / `defer` non-critical JS (search, KG, D3) so it doesn't block
      first paint.
   b. Optimize hero/above-the-fold image (resize/format/responsive) or drop a
      heavy hero if present.
   c. Minify/concat critical CSS; ensure CSS is not render-blocking where avoidable.
   d. Preconnect to fonts CDN / self-host if cheaper.
4. **Graceful & safe:** no behavior change to users; build stays 0-error; lints
   stay green; link-check stays 0 broken.
5. **No secrets/network** at generation.

## Out of scope (governance)
- Rewriting the SSG or changing hosting (Pages is fixed).
- Content changes.
- Adding a build-time image pipeline (P1 — only if root cause is images AND a
  simple responsive/Hugo `process` rule suffices).

## Handoff
- → Spec Kit `.specify/performance.md`: binding R1–Rn + acceptance (target LCP,
  perf-score, bundle-size budget).
- → Beads `.beads/beads.json`: nodes T23–T26.
- → GSD `.gsd/plan.md`: execution + evidence (real measurements).
