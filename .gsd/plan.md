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
