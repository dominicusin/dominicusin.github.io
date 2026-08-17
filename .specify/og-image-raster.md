# Spec — OG/Twitter raster share image

> Spec Kit contract (the "what"). Binding for Beads (state) and GSD (execution).
> Governance: `.planning/initiatives/og-image-raster.md`.

## Context
`og:image`/`twitter:image` currently point at `images/og-default.svg`, which social
platforms cannot render as a link preview. Generate a raster (PNG) share image and
point the site default at it.

## Requirements
- **R1** New `static/images/og-default.png` exists at 1200×630 px (OG standard),
  1.91:1, with the site brand (name + tagline) on the `dominicusin` dark scheme.
- **R2** Source is a reproducible `og-default.svg` (committed or generated) converted
  via `rsvg-convert`; PNG is committed to `static/images/` (served statically).
- **R3** `config/_default/params.toml` `defaultSocialImage` = `images/og-default.png`
  (was `images/og-default.svg`). The existing SVG is left for card thumbnails.
- **R4** Built homepage (and a sample post) emit `og:image` + `twitter:image` ending
  in `.png`; `og:image:type`/`twitter:card` correct.
- **R5** PNG size is reasonable (< 250 KB) so previews load fast.
- **R6** Safety: `hugo` 0 errors; `npm run lint` clean; `npm run test` pass;
  `node scripts/check-links.cjs` 0 broken; `node scripts/check-perf.cjs` 0 regressions.

## Acceptance (measurable)
- `file static/images/og-default.png` is a PNG, dimensions 1200×630, < 250 KB.
- Built `public/index.html` `og:image` value ends with `.png` (grep proves it).
- `defaultSocialImage` in params.toml = `images/og-default.png`.

## Out of scope
- Per-post featured images; card thumbnail SVG behavior.
