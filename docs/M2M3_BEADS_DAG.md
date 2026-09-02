# M2+M3 Beads DAG — Исполняемый план

> Источник: `M2 + M3 — Исполняемый план Autonomous Software Factory.md` → `.beads/beads.json` (39 узлов, DAG без циклов, готов к агенту).

## Сводка
- Добавлено: **14 M2** + **25 M3** = **39 узлов** (`M2-001..M2-014`, `M3-001..M3-025`)
- Всего в `beads.json`: 150 записей (148 уникальных ID; дубли T29/T30 — pre-existing), 121 edge
- DAG валиден: JSON valid, 0 missing deps, 0 cycles, `updated` = сегодня
- Статус всех новых: `pending`; существующие T1..T113 не тронуты

## M2 — Autonomous Execution Runtime (DAG: M2.13)
```
001→004, 002→004, 003→002, 004→011,
005→006, 005→007, 006→007, 007→011,
001→008, 008→009, 008→010, 009→011, 010→011, 012→011,
011→013, 012→013, 013→014
```
| ID | Title | Pri | Risk | Deps |
|---|---|---|---|---|
|M2-001|Git Adapter|P0|R1|—|
|M2-002|Command Runner|P0|R2|—|
|M2-003|Command Policy|P0|R2|M2-002|
|M2-004|Worker Runtime|P0|R2|M2-001,M2-002|
|M2-005|Failure Model|P0|R1|—|
|M2-006|Diagnosis Worker|P1|R1|M2-005|
|M2-007|Retry Engine|P0|R1|M2-005,M2-006|
|M2-008|GitHub Adapter|P0|R3|M2-001|
|M2-009|PR Builder|P1|R3|M2-008|
|M2-010|CI Monitor|P1|R3|M2-008|
|M2-011|Autonomous Loop|P0|R2|M2-004,M2-007,M2-009,M2-010,M2-012|
|M2-012|Human Gates|P1|R2|—|
|M2-013|E2E Autonomous Task|P2|R1|M2-011,M2-012|
|M2-014|M2 Verification|P2|R0|M2-013|

## M3 — Multi-Agent Factory (DAG: M3.26 + derived)
M3-001 deps M2-014 (милстоун-гейт). Далее:
```
M3-001→M3-002, M3-003, M3-004, M3-014, M3-017
M3-002+M3-003+M3-004→M3-005→M3-006
M3-006→M3-007, M3-008, M3-009, M3-010, M3-011, M3-018
M3-007,008,009→M3-012→M3-013
M3-014→M3-015→M3-016
M3-002,014,017→M3-019→M3-020, M3-021
M3-019,020,021→M3-022→M3-023, M3-024 →M3-025
```
| ID | Title | Pri | Risk |
|---|---|---|---|
|M3-001|Registry|P0|R2|
|M3-002|Capability Graph|P0|R1|
|M3-003|Researcher|P1|R1|
|M3-004|Architect|P1|R1|
|M3-005|Planner|P1|R1|
|M3-006|Implementer|P0|R2|
|M3-007|Tester|P0|R1|
|M3-008|Security|P0|R2|
|M3-009|Quality|P1|R1|
|M3-010|Performance|P1|R1|
|M3-011|Accessibility|P1|R1|
|M3-012|Reviewer|P0|R2|
|M3-013|Release|P1|R3|
|M3-014|Evidence Bus|P0|R1|
|M3-015|Event Log|P0|R1|
|M3-016|Supervisor|P0|R2|
|M3-017|Resource Budget|P1|R1|
|M3-018|Scope Guard|P0|R2|
|M3-019|Scheduler|P0|R2|
|M3-020|Parallel RW|P1|R1|
|M3-021|Review Loop|P1|R1|
|M3-022|Multi-Agent E2E|P2|R1|
|M3-023|Failure Injection|P2|R1|
|M3-024|Security E2E|P2|R2|
|M3-025|Final Verification|P2|R0|

Каждый узел содержит: `priority`, `risk`, `artifacts`, `acceptance_criteria[]`, `verification[]` (точные TDD-команды), `initiative`.

## Исполнение агентом
```bash
# выбрать READY (deps done)
node -e "let d=require('./.beads/beads.json'); let done=new Set(d.nodes.filter(n=>n.status==='done').map(n=>n.id)); console.log(d.nodes.filter(n=>n.status==='pending'&&n.deps.every(x=>done.has(x))).map(n=>n.id))"
# TDD цикл узла, напр. M2-001:
node --test agent/git/git.test.cjs
node --test agent/git/worktree.test.cjs
npm run lint
npm test
# верификация M2:
node scripts/verify-m2.cjs && npm run build
# E2E M3:
node --test tests/e2e/m3-multi-agent.test.cjs
node --test tests/e2e/m3-failure-injection.test.cjs
node --test tests/e2e/m3-security.test.cjs
node scripts/verify-m3.cjs
```

Проверено: `node -e JSON.parse(beads.json)` OK, `npm run lint` OK, `npm test` 3/3 suites pass, DAG acyclic, все deps резолвятся.
