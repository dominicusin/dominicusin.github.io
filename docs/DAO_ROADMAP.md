# DAO Roadmap — Engineering Subsystem

> Part of the **Engineering Plane** (see `docs/adr/0002-two-plane-architecture.md`).
> The DAO contracts are independent of the Hugo publishing pipeline: a contract
> bug does NOT break the site, and a site change does NOT redeploy contracts.

## Contracts (`contracts/dao/`)

| Contract | Role | Key parameters |
|----------|------|----------------|
| `GovernanceToken.sol` | ERC-20 voting token (fixed supply) | `MAX_SUPPLY = 1,000,000e18` |
| `SoulboundToken.sol` | Non-transferable identity/membership badge | `SBT` — `transfer` reverted |
| `ProposalEngine.sol` | Timed, quorum-gated proposals | `QUORUM = 4%`, `VOTING_PERIOD = 3 days`, `TIMELOCK = 2 days` |
| | | States: Pending, Active, Succeeded, Queued, Executed, Defeated |

## Test & deploy commands

```bash
npx hardhat test            # 9 passing on local Hardhat network
npx hardhat compile         # emits artifacts/ (gitignored)
# Deploy (needs secrets — guarded job, never runs from a PR):
#   DEPLOY_PRIVATE_KEY, SEPOLIA_RPC_URL  ->  npx hardhat run scripts/deploy-dao.cjs --network sepolia
```

CI: `.github/workflows/deploy-dao.yml` splits into a `test` job (Hardhat, no
secrets, runs on push/PR to `contracts/**`) and a guarded `deploy` job that
fails loudly without secrets. DAO deploy is a **separate track** from the Hugo
Pages deploy.

## Threat model (pre-audit checklist)

- [ ] `onlyOwner` / role checks on `ProposalEngine` admin functions.
- [ ] Quorum math uses scaled integers (no float rounding grief).
- [ ] Timelock gives observers a window to react before execution.
- [ ] SBT `transfer`/`approve` are blocked (no secondary market).
- [ ] Token supply mint is capped at `MAX_SUPPLY`.
- [ ] No `selfdestruct` / `delegatecall` to untrusted targets.

## Public documentation (no build artifacts)

Hugo section `content/dao/` may host educational posts and contract explainers
**without** deploying any contract bytecode. The source of truth remains
`contracts/dao/` + this document.

## Roadmap

1. **Now:** keep `test` green in CI; document intent (this file).
2. **Before any mainnet/testnet deploy:** external audit + threat-model sign-off.
3. **Later:** educational posts, demo pages, possible separate package/workspace
   once the surface grows beyond 3 contracts.
4. **Never:** auto-deploy contracts from the site pipeline.
