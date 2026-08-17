# BMAD — Initiative: `og-image-raster`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Self-identified initiative (autonomous task-setting). Contract → Spec Kit.
> State → Beads. Execution → GSD.

## Why (reasoning)
Audit of the built homepage found `og:image` / `twitter:image` point at
`/images/og-default.svg`. **Social platforms (X/Twitter, Telegram, Slack,
Discord, Facebook, LinkedIn) do NOT render SVG as a link preview image** — they
require a raster format (PNG/JPEG). Result: sharing the site's URL shows NO preview
image. This is a real, user-visible defect (the whole point of OG/Twitter cards).
`robots.txt` and canonical/sitemap are fine, so this is the highest-value, ownable
hygiene fix.

## Shape (locked decisions)
1. **Do NOT break existing usage.** `og-default.svg` is also used as a decorative,
   lazy-loaded thumbnail in content cards (`role=presentation`). Leave it there.
   Create a SEPARATE raster asset for social sharing.
2. **Generate `static/images/og-default.png` at 1200×630** (Open Graph standard
   dimensions, 1.91:1) with the site brand (name + tagline) on the `dominicusin`
   dark scheme. Reproducible locally via `rsvg-convert` from a purpose-built
   `og-default.svg` source (no external service, no secrets).
3. **Switch `config/_default/params.toml` `defaultSocialImage`** from the SVG to
   `images/og-default.png`. Blowfish emits `og:image` + `twitter:image` +
   `og:image:type`/`twitter:card` from this.
4. **Graceful & safe:** build stays 0-error; lint/test/linkcheck stay green; no
   behavior change to cards or theme.
5. **Supply-chain note:** `rsvg-convert` is a build-time dev tool only (used to
   produce the committed PNG); it is NOT a runtime dependency. The PNG is
   committed to `static/images/` and served as a static asset.

## Out of scope
- Per-page OG images (only the site-wide default fallback is addressed; per-post
  `featured`/`cover` images already work via Blowfish).
- Changing the card thumbnails (SVG stays there, works as decoration).

## Handoff
- → Spec Kit `.specify/og-image-raster.md`: R1–Rn + acceptance.
- → Beads `.beads/beads.json`: T33–T36.
- → GSD `.gsd/plan.md`: execution + evidence.
