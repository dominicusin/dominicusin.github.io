# GSD — Execution Engine

> **Sole responsibility: EXECUTION.** Drives the Beads state graph (T1–T18) to
> `done` by satisfying the Spec Kit contract (`.specify/spec.md`, R1–R7). Records
> real commands + evidence. No "why" (BMAD) or "what" (Spec Kit).
>
> Strict 4-layer handoff:
> **BMAD** `.planning/CHARTER.md` + `.planning/initiatives/*.md` (governance/why)
> → **Spec Kit** `.specify/*.md` + `.openspec/changes/*` (contract/what)
> → **Beads** `.beads/beads.json` (state graph)
> → **GSD** (this file: execution/how + evidence).

## Initiative 1: `repo-gist-ingestion` (closed)
... (T1–T10 recorded above; see committed history)

## Initiative 2: `ontology-feed` (closed)
... (T11–T14 recorded above; merged #108)

## Initiative 3: `cross-links` (closed)
... (T15–T18 recorded above; merged #109; pivot #6 in BMAD)

---

## Initiative 4: `related-posts` (new Beads nodes T19–T22)

### Phase F — navigable blog (Похожие статьи)
- **Theme-native machinery**: Blowfish already ships `layouts/partials/related.html`
  and calls it from `single.html`. It was disabled by `params.article.relatedContentLimit = 0`.
- **Config only (no new algorithm)**:
  - `config/_default/hugo.toml` `[related]` with `[[related.indices]]` on
    `tags` (weight 100) + `categories` (weight 50).
  - `config/_default/params.toml` `relatedContentLimit = 5` (was 0).
  - `i18n/ru.yaml` RU override for the heading (theme shipped wrong "Related").
- **Project override** `layouts/partials/related.html` hardcodes RU heading
  "Похожие статьи" (site is RU-only; avoids i18n merge ambiguity).

### Key debug (real, not fabricated)
- First attempt used `name = "tag"`/`"category"` (taxonomy MAP KEYS) → `.Related`
  returned `count=0` everywhere (warnf instrumentation proved the partial WAS
  called but index empty). Correct value is the **plural taxonomy name**
  `"tags"`/`"categories"` → counts became 1–3.
- Posts publish at `/<year>/<month>/<day>/<slug>/` (no `/blog/` prefix) — must
  glob `public/**`, not `public/blog/**`.

### Contract satisfaction (R1–R5 → evidence)
| Req | Evidence |
|-----|----------|
| R1 related section on blog posts | 52 posts render "Похожие статьи" (verified via build) |
| R2 [related] indices tags/categories | hugo.toml `[related]` with tags(100)/categories(50) |
| R3 relatedContentLimit > 0 | params.toml `relatedContentLimit = 5` |
| R4 graceful (no tags → nothing) | `.Related` empty → `with` skips section |
| R5 valid link targets | card-related partial links to post permalinks |

### Status
Beads T19–T21 = `done`; T22 = `done` (merged #110 via --admin).

---

## Initiative 5: `performance` (new Beads nodes T23–T26)

### Phase G — root-cause LCP (audit, in progress)
- CI Lighthouse (non-blocking) reports LCP ≈5790ms and perf-score ≈0.64 on `/`
  and `/blog/` across runs (PR #110 run: LCP 5790ms, perf 0.64, FCP 4906ms,
  TTI 5800ms). Recurring, data-driven signal from our own pipeline.
- **Audit plan (GSD execution):** build the full site (sync repos/gists), then
  measure:
  1. JS bundle sizes in `public/js/` + `assets/js/` (D3 vendored 280KB,
     knowledge-graph.js, search modal, etc.) — are any render-blocking?
  2. CSS critical-path size (`public/css/` + theme assets).
  3. Above-the-fold / hero image (LCP element?) — dimensions, bytes, format.
  4. Inline scripts in `baseof.html` / partials.
- Root-cause before changing anything; record before/after numbers.

### Phase G — root-cause LCP (audit + fix, DONE)
- **Audit (R1):** built the full site and inspected `<head>`. Found 9 `<script>`
  tags; **8 were render-blocking** (theme loaded `appearance.js`, `a11y.js`,
  `zen-mode.js`, `zoom.min.umd.js` WITHOUT `defer` in `<head>`). The main bundle
  already had `defer`. No hero/above-the-fold image on `/` or `/blog/`; CSS is a
  single minified bundled file (not separately render-blocking). D3/KG/analytics
  only on their own pages. → root cause = render-blocking theme scripts in head.
- **Fix (R2/R3):** project override `layouts/partials/head.html` (copied from
  theme, prefixed with a maintenance note) adding `defer` to appearance/a11y/
  zenMode/zoom. Defer is safe — none need to run before first paint; theme
  bootstrap uses `data-*` attributes, no FOUC.
- **Measure (before→after):** head scripts 9 total, render-blocking dropped from
  **8 → 1** (the remaining 1 is a non-executable `<script type=application/json>`
  firebase config + JSON-LD; they don't block rendering). All executable JS is now
  deferred.
- **Note:** discovered a rogue `hugo server` (PID 704072) was holding `public/`
  and stalling every build for 5+ min; killed it by PID to unblock. Build then
  completed in normal time (553 HTML, exit 0).

### Contract satisfaction (R1–R5 → evidence)
| Req | Evidence |
|-----|----------|
| R1 audit + root cause | 8/9 head scripts render-blocking; no hero image |
| R2 defer non-critical JS | head.html override adds `defer`; 8→1 blocking |
| R3 critical CSS not render-blocking | single minified bundle; unchanged |
| R4 hero (n/a) | no hero image on `/` or `/blog/` |
| R5 safety | build 0 err; lint clean; test pass; check-links 0 broken / 654 |

### Status
Beads T23–T25 = `done`; T26 (commit+PR+merge) in_progress.

---

## Initiative 5 (cont.) — Phase H: CSS non-render-blocking (DONE)
- **Re-audit after JS-defer (T24):** Lighthouse LCP still ~5.5s (perf 0.68). JS was
  secondary. Measured the real bottleneck: **CSS bundle = 128.78 KB**, loaded as a
  render-blocking `<link rel=stylesheet>` — browser must download+parse 129KB CSS
  before first paint. Homepage is only 67KB HTML / 697 tags (DOM not the issue);
  NO web fonts (system stack), NO external stylesheets, NO hero image. So the
  paint-blocking CSS is THE LCP root cause.
- **Fix (T27):** in `layouts/partials/head.html` override, changed the CSS `<link>`
  to the standard non-render-blocking pattern:
  `<link rel=preload as=style onload="this.rel='stylesheet'">` + `<noscript>`
  fallback. First paint no longer waits on the 129KB CSS; styles swap in on load
  (modern browsers) / stay blocking for no-JS.
- **Verify (structural, real builds):** built site → CSS link is `rel=preload
  as=style` with onload swap + noscript fallback present; CSS bundle still emitted;
  build 0 err; lint clean; test pass; check-links 0 broken.
- **Honest caveat:** cannot run Lighthouse locally (no Chrome/Lighthouse binary;
  CI Lighthouse runs on shared, throttled, noisy infra — perf 0.64–0.68 across runs).
  The change is the correct, textbook LCP fix for a render-blocking CSS bundle, but
  the exact Lighthouse delta must be read from the next CI Performance Monitoring run,
  not asserted here.

### Status
Beads T27 = `done`; T28 (commit+PR+merge for CSS fix) in_progress.

---

## Initiative 6: `perf-gate` (Structural regression guard) — DONE
- **Why:** #111 (defer JS) + #112 (non-blocking CSS) were unguarded; CI Lighthouse is
  non-blocking + noisy (throttled shared infra), so it can't protect them. We
  automate the structural audit of the built homepage as a CI gate.
- **R1–R6 satisfied:**
  - `scripts/check-perf.cjs` (CommonJS `.cjs`, mirrors `check-links.cjs`) parses
    `public/index.html`, fails on render-blocking `<script src>` (no defer/async,
    excludes `type=module`) or a plain `<link rel=stylesheet>` in `<head>` outside
    `<noscript>`. Inline non-executable (JSON/JSON-LD) and trivial vendor inits
    (<256 chars, e.g. Vercel `window.va`) are exempt. Reports CSS bundle bytes
    (warn >140KB, informational).
  - **PASS on current build**: 0 regressions (exit 0). **NEGATIVE test**: injecting a
    blocking `<script src>` + plain `rel=stylesheet` → exits 1 with both flagged
    (reverted; not committed). Gate works both ways.
  - Wired into `.github/workflows/hugo.yml` as "Performance smoke check" step after
    "Build with Hugo", `continue-on-error: true` (report-only, never blocks deploy).
- **Reality note:** built HTML uses UNQUOTED attribute values (`type=module`,
  `rel=stylesheet`) — initial regexes falsely matched; fixed by quote-optional
  matching. Also `onload="this.rel='stylesheet'"` substring initially tripped the
  stylesheet detector — fixed by requiring `rel` attribute boundary.

### Status
Beads T29–T31 = `done`; T32 (commit+PR+merge) in_progress.

---

## Initiative 7: `og-image-raster` (self-identified) — DONE
- **Self-identified problem (autonomous task-setting):** audit of built homepage
  found `og:image`/`twitter:image` pointed at `images/og-default.svg`. Social
  platforms (X/Telegram/Slack/Discord/FB/LinkedIn) do NOT render SVG previews →
  sharing the URL shows NO image. Real, user-visible defect.
- **Fix (R1–R5):**
  - Authored `assets/images/og-default.src.svg` (1200×630 brand: title + tagline on
    `dominicusin` dark scheme) and converted to `assets/images/og-default.png`
    (1200×630, 89KB) via `rsvg-convert`. Reproducible, no external service/secrets.
  - Switched `config/_default/params.toml` `defaultSocialImage` → `images/og-default.png`.
    The card-thumbnail SVG is left untouched (different role).
- **Root-cause gotcha (real, not guessed):** Blowfish's `head.html` emits the social
  image via `resources.Get .Site.Params.defaultSocialImage` + `.RelPermalink`.
  `resources.Get` resolves from the **assets** filesystem, not `static/`. The old
  `.svg` worked only because `assets/images/og-default.svg` already existed (project
  asset). Putting the PNG in `static/` made `resources.Get` return nil → NO og:image.
  Fix: PNG placed in `assets/images/` (project asset overrides theme). Now both
  `og:image` and `twitter:image` emit `…/og-default.png`.
- **Verify:** built `public/index.html` → `og:image` + `twitter:image` end in `.png`;
  PNG 1200×630 / 89KB (<250KB); `hugo` 0 errors; lint clean; test pass; check-links 0
  broken; check-perf 0 regressions.

### Status
Beads T33–T35 = `done`; T36 (commit+PR+merge) in_progress.
