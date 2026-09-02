# M4 — Adaptive Autonomous Software Factory (Executable DAG)

> Source: `M4 — Adaptive Autonomous Software Factory, 8 epics M4-001..078` → `.beads/beads.json` (78 nodes, acyclic, agent-ready). Initiative `autonomous-factory-m4`.

## Summary
- Added: **78 M4 nodes** (`M4-001..M4-078`)
- Total in `beads.json`: **228 rows / 226 unique IDs** (legacy dup T29/T30 retained), **223 edges**
- DAG valid: JSON valid, 0 missing deps, 0 cycles, `updated=2026-09-03`
- All M4 `status=pending`, `priority P1/P2`, `risk R1/R2`, `kind=task`, `initiative=autonomous-factory-m4`
- Style parity with M2/M3: each node has `artifacts`, `acceptance_criteria`, `verification[]` (exact TDD commands)

## ASCII DAG (8 epics, per proposal)
```
                        M3-025 (Final gate)
                        ┌──────┴──────┐
              M4-001..006 Memory   M4-007..012 Repo Intelligence
                        └──────┬──────┘
                        M4-013..019 Adaptive Planner
                          ┌──────┼──────┐
              M4-020..025 Backlog  M4-026..032 Learning  M4-047..055 Supervisor
              M4-040..046 Observability (parallel infra)
                          └──────┼──────┘
                        M4-033..039 Factory Verification (waits backlog+learning; observability+supervisor join at Policy)
                              │
                        M4-056..062 Policy 2.0 (waits verification+observability+supervisor)
                              │
                        M4-063..070 Self-Healing
                              │
                        M4-071..078 Autonomous Factory E2E
```

Concrete `deps` wiring (keeps DAG acyclic; forward numeric refs 033→046/055 documented as intentional — IDs follow proposal order, topology is stage order):

| Stage | Nodes | Deps |
|---|---|---|
| Memory | M4-001 deps M3-025; M4-002,003,004 deps M4-001; M4-005 deps M4-002,003; M4-006 deps M4-004,005 | M3-025 |
| Repo Intel | M4-007 deps M3-025; M4-008,009 deps M4-007; M4-010 deps M4-008,009; M4-011 deps M4-008; M4-012 deps M4-010,011 | M3-025 |
| Adaptive Planner | M4-013 deps M4-006,M4-012; M4-014,015 deps M4-013; M4-016 deps M4-014; M4-017 deps M4-015,016; M4-018 deps M4-017; M4-019 deps M4-018 | memory+intel |
| Backlog | M4-020 deps M4-019; M4-021,022 deps M4-020; M4-023 deps M4-021,022; M4-024 deps M4-023; M4-025 deps M4-024 | M4-019 |
| Learning | M4-026 deps M4-019; M4-027 deps M4-026; M4-028 deps M4-027; M4-029,030 deps M4-028; M4-031 deps M4-029,030; M4-032 deps M4-031 | M4-019 |
| Observability | M4-040 deps M4-019; M4-041,042 deps M4-040; M4-043 deps M4-041,042; M4-044 deps M4-043; M4-045 deps M4-044; M4-046 deps M4-045 | M4-019 |
| Supervisor | M4-047 deps M4-019; M4-048,049 deps M4-047; M4-050 deps M4-048,049; M4-051 deps M4-050; M4-052 deps M4-051; M4-053 deps M4-052; M4-054 deps M4-053; M4-055 deps M4-054 | M4-019 |
| Verification | M4-033 deps M4-025,M4-032; M4-034,035,036 deps M4-033; M4-037 deps M4-034,035,036; M4-038 deps M4-037; M4-039 deps M4-038 | backlog+learning |
| Policy 2.0 | M4-056 deps M4-039,M4-046,M4-055; M4-057,058 deps M4-056; M4-059 deps M4-057,058; M4-060 deps M4-059; M4-061 deps M4-060,M4-055; M4-062 deps M4-061 | verification+observability+supervisor |
| Self-Healing | M4-063 deps M4-062; M4-064 deps M4-063,M4-032; M4-065 deps M4-064; M4-066 deps M4-065; M4-067 deps M4-066; M4-068 deps M4-067; M4-069 deps M4-068; M4-070 deps M4-069 | Policy, Learning |
| Factory E2E | M4-071 deps M4-070,M4-039; M4-072,073,074,075 deps M4-071; M4-076 deps M4-072,073,074,075; M4-077 deps M4-076; M4-078 deps M4-077,M4-070,M4-062 | self-healing |

## Epic breakdown → artifacts

| Epic | ID range | Files (artifacts) | TDD example |
|---|---|---|---|
| Persistent Memory | M4-001..006 | `agent/memory/memory.cjs, episodic.cjs, semantic.cjs, procedural.cjs, decisions.cjs, failures.cjs` | `node --test agent/memory/memory.test.cjs` |
| Repository Intelligence | M4-007..012 | `agent/intelligence/repository-graph.cjs, dependency-graph.cjs, ownership.cjs, change-impact.cjs, hotspots.cjs` | `node --test agent/intelligence/repository-graph.test.cjs` |
| Adaptive Planner | M4-013..019 | `agent/planner/planner.cjs, decomposition.cjs, prioritizer.cjs, dependency-resolver.cjs, replanner.cjs` | `node --test agent/planner/planner.test.cjs` |
| Backlog Manager | M4-020..025 | `agent/backlog/discovery.cjs, prioritization.cjs, deduplication.cjs, decomposition-backlog.cjs, stale-task-detector.cjs` | `node --test agent/backlog/discovery.test.cjs` |
| Learning & Feedback | M4-026..032 | `agent/learning/outcome.cjs, metrics.cjs, pattern-miner.cjs, worker-performance.cjs, failure-patterns.cjs` | `node --test agent/learning/outcome.test.cjs` |
| Factory Verification | M4-033..039 | `agent/verification/invariant-checker.cjs, regression-detector.cjs, policy-verifier.cjs, evidence-verifier.cjs, factory-health.cjs` | `node --test agent/verification/invariant-checker.test.cjs` |
| Observability | M4-040..046 | `agent/observability/events.cjs, metrics.cjs, traces.cjs, dashboard.cjs, reports.cjs` | `node --test agent/observability/events.test.cjs` |
| Factory Supervisor | M4-047..055 | `agent/supervisor/factory-supervisor.cjs, scheduler-integration.cjs, resource-guard.cjs, policy-hook.cjs` | `node --test agent/supervisor/factory-supervisor.test.cjs` |
| Policy 2.0 | M4-056..062 | `agent/policy/policy-v2.cjs, scope-v2.cjs, gates-v2.cjs, allowlist-v2.cjs, dsl.cjs` | `node --test agent/policy/policy-v2.test.cjs` |
| Self-Healing | M4-063..070 | `agent/healing/planner.cjs, retry-learning.cjs, diagnosis-bridge.cjs, quarantine.cjs` | `node --test agent/healing/planner.test.cjs` |
| End-to-End Factory | M4-071..078 | `agent/factory/autonomous-factory.cjs, tests/e2e/m4-*.test.cjs, scripts/verify-m4.cjs, docs/M4_VERIFICATION.md` | `node --test tests/e2e/m4-happy-path.test.cjs` |

All nodes: `priority P1` (001..039 foundational) → `P2` (040..078 integration/E2E), `risk R1` default, `R2` on policy/self-healing/factory gates.

## Agent execution

```bash
# pending READY (deps done)
node -e "let d=require('./.beads/beads.json');let done=new Set(d.nodes.filter(n=>n.status==='done').map(n=>n.id));console.log(d.nodes.filter(n=>n.status==='pending'&&n.deps.every(x=>done.has(x))).map(n=>n.id).join('\n'))"

# TDD per node — examples
node --test agent/memory/memory.test.cjs
node --test agent/intelligence/repository-graph.test.cjs
node --test agent/planner/planner.test.cjs
node --test agent/backlog/discovery.test.cjs
node --test agent/learning/outcome.test.cjs
node --test agent/verification/invariant-checker.test.cjs
node --test agent/observability/events.test.cjs
node --test agent/supervisor/factory-supervisor.test.cjs
node --test agent/policy/policy-v2.test.cjs
node --test agent/healing/planner.test.cjs
node --test agent/factory/autonomous-factory.test.cjs

# E2E Factory
node --test tests/e2e/m4-happy-path.test.cjs
node --test tests/e2e/m4-failure-recovery.test.cjs
node --test tests/e2e/m4-policy-deny.test.cjs
node --test tests/e2e/m4-budget.test.cjs
node --test tests/e2e/m4-concurrency.test.cjs
node scripts/verify-m4.cjs

# Full gate (M4-078)
node scripts/verify-m4.cjs && npm run lint && npm test && npm run build && npx hardhat test
```

## Validation
```bash
python3 -c "import json; json.load(open('.beads/beads.json')); print('JSON OK')"
node -e "let d=require('./.beads/beads.json'); let ids=new Set(d.nodes.map(n=>n.id)); let miss=d.nodes.flatMap(n=>n.deps.filter(x=>!ids.has(x)).map(x=>n.id+'->'+x)); console.log(miss.length?miss:'all deps resolve')"
# cycle check via edges
npm run lint
```

## Notes
- Existing T1..T113, M2-001..014, M3-001..025 untouched (status/dag preserved).
- M4 deps use `M3-025` as M3 milestone gate (max in current file).
- Pretty JSON 2 spaces, `initiative=autonomous-factory-m4` on all M4, `deps` acyclic.
- Forward refs `M4-033..039 → M4-046/M4-055` are intentional to honor proposal ID order while keeping stage order per ASCII DAG; topological order is stage order, not numeric order.
