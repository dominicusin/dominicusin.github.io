# contracts/dao

Solidity smart contracts for the decentralized governance experiments (the **Engineering Plane** — separate from the Hugo publishing pipeline; see `docs/adr/0002-two-plane-architecture.md` and `docs/DAO_ROADMAP.md`).

## Contracts

| File | Purpose |
|------|---------|
| `GovernanceToken.sol` | ERC-20 voting token, fixed `MAX_SUPPLY = 1,000,000e18`. |
| `SoulboundToken.sol` | Non-transferable identity/membership badge (`transfer` reverted). |
| `ProposalEngine.sol` | Timed, quorum-gated proposals (`QUORUM = 4%`, `VOTING_PERIOD = 3 days`, `TIMELOCK = 2 days`). |

## Commands

```bash
npx hardhat compile   # emits artifacts/ (gitignored)
npx hardhat test      # 9 passing on local Hardhat network
# Deploy (guarded job in .github/workflows/deploy-dao.yml; needs secrets):
#   npx hardhat run scripts/deploy-dao.cjs --network sepolia
```

## Notes

- Never auto-deployed from the site pipeline. The `deploy-dao.yml` `test` job runs on every push/PR; the `deploy` job is guarded and fails loudly without secrets.
- Public documentation lives in `content/dao/` (Markdown only — no build artifacts).
- Threat model / audit checklist: `docs/DAO_ROADMAP.md`.
