# BMAD — Initiative: `cls-fix`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Self-identified (Lighthouse CI CLS=1.0 on every deploy; user flagged emptiness
> first, gists fixed separately). Contract → Spec Kit. State → Beads. GSD.

## Why (reasoning) — ROOT CAUSE, VERIFIED FROM BUILD
Lighthouse CI consistently reports `cumulative-layout-shift` = **1.0** (the max)
on the deployed homepage — a real, full-viewport layout shift, NOT the LCP jitter
I earlier (correctly) judged as noisy. A CLS of exactly 1.0 is deterministic and
severe, so I investigated rather than dismissing it.

Local Chromium measurement is BLOCKED: the NixOS environment fails to launch the
Playwright browser (`[nix-ld] FATAL: Posix(2)` — same class of breakage as the
Firestore emulator JDK failure). So I reasoned from the build output instead of
guessing blindly.

The built `public/index.html` `<head>` showed the CSS bundle loaded as:
```
<link rel=preload as=style href=/css/main.bundle.min...css
      onload='this.onload=null,this.rel="stylesheet"'>
<noscript><link rel=stylesheet ...></noscript>
```
i.e. the **non-render-blocking preload+swap from PR #112**. Mechanism: with
`rel=preload` (not `rel=stylesheet`), the browser does NOT block first paint on
the CSS, so the page paints **UNSTYLED** (raw HTML, full-width stacked blocks,
tall), then snaps into the styled layout when the bundle loads → a full-viewport
layout shift = **CLS ≈ 1.0**. A render-blocking `rel=stylesheet` does NOT cause
CLS because content simply does not paint until styled.

PR #112 traded a *marginal, CI-noise* LCP improvement for a *catastrophic, real*
CLS regression. That trade is wrong. The 128KB bundle is already-purged component
CSS (not trimmable without dropping features — established earlier), so
render-blocking it is the correct state.

## Shape (locked decisions)
1. **Revert CSS to render-blocking** in `layouts/partials/head.html`:
   `<link rel="stylesheet" href=… integrity=…>` (no preload/onload swap, no
   noscript fallback needed). Keep JS **deferred** (PR #111 — defer does not cause
   CLS and was a clean win; keep it).
2. **Update `scripts/check-perf.cjs`**: a render-blocking stylesheet is now
   ACCEPTABLE (it's the CLS fix), so the gate must NOT fail on `rel=stylesheet`.
   It only reports bundle size as informational. The gate still fails on a
   render-blocking executable `<script>` (the real #111 regression guard).
3. **Keep `scripts/probe-cls.cjs`** as a diagnostic (measures CLS via
   PerformanceObserver) — useful on non-NixOS runners; not a CI gate here because
   the local browser can't launch.
4. **Graceful:** build 0 errors; lint/test/linkcheck/perf-gate green.

## Out of scope
- Trimming the 128KB CSS (already-purged component CSS; not viable without
  dropping features).
- The separate `mediumZoom` ReferenceError / `/_vercel/insights` 404 (real but
  separate bugs — deferred to their own initiative).

## Handoff
- → Spec Kit `.specify/cls-fix.md`.
- → Beads `.beads/beads.json`: T45–T48.
- → GSD `.gsd/plan.md`: Phase M execution + evidence.
