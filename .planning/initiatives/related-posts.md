# BMAD — Initiative: `related-posts`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> Contract → Spec Kit (`.specify/related-posts.md`). State → Beads. Execution → GSD.

## Why (reasoning)
The ontology is now documented, visualized, machine-readable, and repo-navigable
(cross-links). But the **blog itself** is not navigable: a reader of one post
cannot jump to other posts on the same topic. Posts are first-class ontology
nodes (tagged, categorized); linking them by shared tags closes the loop and
makes the knowledge graph traversable from within the reading experience.

## Shape (locked decisions)
1. **Use Hugo's built-in Related Content**, not a custom script. The Blowfish
   theme already ships `layouts/partials/related.html` and calls it from
   `single.html` — it is disabled only because `params.article.relatedContentLimit
   = 0`. We enable it via config, not new code. (Governance: prefer theme-native
   machinery over bespoke scripts — consistent with parent charter #3.)
2. **Configure the related index** in `hugo.toml` `[related]` with indices on
   `tags` (primary) and `categories` (secondary), so `.Site.RegularPages.Related`
   ranks by shared tags. Set `params.article.relatedContentLimit = 5`.
3. **Scope = blog posts only.** `.Related` operates on `RegularPages`; repo/gist
   pages are not RegularPages of the same kind, so they won't pollute results.
   (Repo↔repo linking remains the `cross-links` initiative's job.)
4. **Graceful:** if a post has no tags, `.Related` returns empty → partial renders
   nothing. No empty heading, no error.
5. **No secrets/network.** Pure config + theme partial.

## Out of scope (governance)
- Custom related algorithm (embedding/semantic) — built-in keyword index only.
- Cross-linking posts to repos (no signal; see `cross-links` pivot #6).

## Handoff
- → Spec Kit `.specify/related-posts.md`: binding R1–Rn + acceptance.
- → Beads `.beads/beads.json`: nodes T19–T22.
- → GSD `.gsd/plan.md`: execution + evidence.
