# Beads — State Graph

> **Sole responsibility: the STATE GRAPH.** Task nodes, statuses, dependency edges.
> No prose status (that lives in the graph). No "why" (BMAD) or "what" (Spec Kit)
> or "how executed" (GSD) — only *current state*.

## Stack (strict separation — each layer owns exactly one concern)
| Layer | Tool | Owns |
|-------|------|------|
| Governance / reasoning | **BMAD** | `.planning/CHARTER.md` — why + shape + locked decisions |
| Contract | **Spec Kit / OpenSpec** | `.specify/spec.md` + `.openspec/changes/*` — binding "what" + acceptance |
| **State graph** | **Beads** | this dir — `beads.json` (nodes/edges/status) |
| Execution | **GSD** | `.gsd/plan.md` — drives the graph to `done`, records evidence |

## How to read `beads.json`
- `nodes[].status` ∈ {done, in_progress, blocked, pending}
- `edges[].type` ∈ {enables, feeds, blocks}
- `blocked` nodes name their blocker; `done` nodes may carry `verified` evidence refs.

## Current initiative: `repo-gist-ingestion`
All 10 nodes (T1–T10) are `done`. For the authoritative live state, read
`beads.json` — not this prose. Execution evidence (commands + outputs) is in
**GSD** (`.gsd/plan.md`); acceptance criteria are in **Spec Kit** (`.specify/spec.md`).
