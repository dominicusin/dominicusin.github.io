# Beads — State Graph

Task system for `dominicusin.github.io`, initiative **repo-gist-ingestion**.

## Stack (strict separation of concerns)
| Layer | Tool | Responsibility |
|-------|------|----------------|
| Governance / reasoning | **BMAD** | `.planning/CHARTER.md` — why + shape + locked decisions |
| Contract | **Spec Kit / OpenSpec** | `.specify/spec.md` + `.openspec/changes/*` — binding requirements + acceptance |
| State graph | **Beads** | this file + `beads.json` — tasks, statuses, dependency edges |
| Execution | **GSD** | drives tasks T7→T10 to done (verify → commit → PR → CI smoke) |

## Status summary
- `done`: T1 (tag cloud, PR #106), T2–T6 (core feature implemented & locally verified)
- `in_progress`: T7 (rel-link rewrite — code done, re-verify pending)
- `blocked`: T8 (GitHub API rate limit from prior test runs; needs reset)
- `pending`: T9 (PR), T10 (live CI smoke test)

## How to read `beads.json`
`nodes[].status` ∈ {done, in_progress, blocked, pending}. `edges[].type` ∈
{enables, feeds, blocks}. Blocked tasks name their blocker.
