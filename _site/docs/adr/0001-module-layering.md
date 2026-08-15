# ADR 0001 — `src/` module layering and dependency direction

- **Status:** Accepted (verified 2026-08-15)
- **Context:** The Deep Refactoring Plan (Phase 3) requires `src/` to have a
  strict layered hierarchy with dependencies flowing only downward
  (`config → utils → core → services → modules → index`), no cycles, no
  upward imports. This was checked empirically after the v4.0 additions
  (CRDT/P2P/DAO/BCI modules) landed.
- **Decision:** Enforce and document the layering rule. Dependencies MUST point
  from a higher-rank layer to a lower-rank one; `index.js` is the sole
  orchestrator. Peer layers (e.g. `modules/` importing `services/`) are allowed
  only downward.
- **Verification (reproducible):**
  - DFS scan over all relative `import` edges in `src/**/*.js`: **0 cycles**.
  - Layer-direction scan (config<utils<core<services<modules<agents<workers):
    **0 upward-dependency violations**.
  - `src/modules/` v4.0 files (crdt-sync, graph-sync, webrtc-transport,
    bci-controller, eeg-adapter) participate in the same acyclic graph.
- **Consequences:**
  - New modules may import from `config/`, `utils/`, `core/`, `services/` but
    not upward.
  - A CI check (madge/dependency-cruiser) SHOULD be added later to keep this
    enforced automatically (Phase 3 follow-up, not yet wired into CI).
- **Alternatives considered:** flat imports (rejected — unverifiable coupling);
  barrel re-exports across layers (rejected — hides direction).
