# BMAD — Initiative: `gist-names`

> Governance/reasoning only: WHY + SHAPE + locked decisions.
> User-requested (focus-topic): on /gists/ show human names, not hash IDs.
> Contract → Spec Kit. State → Beads. GSD.

## Why (reasoning)
On `/gists/` every card shows `gist_id` (a 32-char hash like
`21432fc5f29c73591044eafa09e6fafc`) as the card name. That is unreadable and
useless to a visitor. The user explicitly wants the **name** — e.g. the gist
`21432…` whose `description` is `zroot` and whose first file is `zroot` should
render as **"zroot zroot"**, not the hash.

The data already carries the name parts: `description` + first `file.name`.
The generated page frontmatter (from `scripts/sync-github.cjs writeGistPage`)
has `title` (= description), `files` (= list of file names), and `gist_id`
(= hash). The list template currently renders `.Params.gist_id`. So the fix is
purely: derive a `gist_name` and render it instead of the hash.

## Shape (locked decisions)
1. `scripts/sync-github.cjs writeGistPage`: add `gist_name` to frontmatter =
   `(description ? description + ' ' : '') + firstFileName`. If a gist has no
   files, fall back to `description || gist.id`. This yields "zroot zroot" for the
   example and a readable name for every gist.
2. `layouts/gists/list.html`: render `{{ .Params.gist_name }}` (not `gist_id`) as
   the card name. Keep the hash available only as the URL (already is).
3. `layouts/gists/single.html`: show `gist_name` on the page header (in addition
   to the existing `<h1>{{ .Title }}>` — or replace the h1 with gist_name so the
   single page title is also human-readable). Keep `gist_id` in frontmatter for
   data fidelity (not displayed).
4. Regenerate `content/gists/*.md` via the sync script, rebuild, verify the card
   text is the name (not the hash) for the example gist and for the list overall.
5. Safety: hugo 0 errors; lint/test/linkcheck/perf green.

## Out of scope
- Changing the URL slug (must stay `<id>` so live links keep working).
- Ontology/taxonomy expansion (separate initiative).

## Handoff
- → Spec Kit `.specify/gist-names.md`.
- → Beads `.beads/beads.json`: T49–T52.
- → GSD `.gsd/plan.md`: Phase N.
