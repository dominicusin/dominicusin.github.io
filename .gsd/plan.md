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
Beads T19–T21 = `done`; T22 (commit+PR+merge) in_progress — CI live run confirms.
