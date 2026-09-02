# Agent Truth Policy — `dominicusin.github.io`

> **Приоритет источников истины:**
> `CODE > CONFIG > CI > TESTS > RECENT GIT > CURRENT DOCS > OLD DOCS`

## 1. Hierarchy of Truth

### 1.1. CODE (highest priority)

Runtime behavior beats everything else.
- Build output beats documentation claims
- Running code beats aspirational docs
- Verified execution beats assumed state

### 1.2. CONFIG

Configuration beats strategic claims.
- `config/_default/hugo.toml` beats roadmap goals
- `.github/workflows/` beats CI documentation
- `package.json` beats dependency claims

### 1.3. CI

CI behavior beats documentation claims.
- Failing CI blocks regardless of docs claiming "green"
- Required checks beats optional checks

### 1.4. TESTS

Tests beat undocumented assumptions.
- Passing tests = feature works (until proven otherwise)
- Failing tests = feature broken (regardless of intent)

### 1.5. RECENT GIT

Recent commits beat stale plans.
- Last 20 commits = current direction
- Merge history = what actually shipped

### 1.6. CURRENT DOCS

`AGENTS.md`, `README.md`, `.planning/`, ADR beat old docs.

### 1.7. OLD DOCS (lowest priority)

Archived docs, outdated plans, superseded strategies — never authoritative.

## 2. Evidence Requirements

### 2.1. Every factual claim requires evidence

```
❌ "Tests pass."
✅ { "command": "npm test", "exit_code": 0, "commit": "abc123", "timestamp": "..." }
```

### 2.2. Prohibited actions

- Agent may NOT invent repository state
- Agent may NOT assume behavior without verification
- Agent may NOT extrapolate from stale snapshots
- Agent may NOT suppress negative evidence

### 2.3. Required evidence format

```yaml
evidence:
  command: string
  exit_code: number
  commit: string (SHA)
  timestamp: ISO-8601
  stdout_hash: SHA-256
  duration_ms: number
  output_path: string (optional)
```

## 3. Verification Protocol

### 3.1. Before claiming success

1. Run verification command
2. Capture exit code
3. Hash stdout
4. Record commit SHA
5. Store evidence artifact

### 3.2. Before claiming failure

1. Run verification command twice
2. Confirm same exit code
3. Capture error output
4. Classify failure type
<longcat_arg_value>
