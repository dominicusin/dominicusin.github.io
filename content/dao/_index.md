---
title: "DAO Governance"
description: "Decentralized governance for dominicus.in. Create proposals, vote, and shape the future of engineering knowledge."
layout: "dao"
---

Connect your wallet to participate in governance. Create proposals, vote on changes, and help shape the future of dominicus.in.

## How it works

1. **Connect** your wallet (MetaMask, WalletConnect, etc.)
2. **Check** your governance token balance and voting power
3. **Create** proposals (minimum 100 tokens required)
4. **Vote** on active proposals
5. **Execute** passed proposals after timelock

## Governance Parameters

| Parameter | Value |
|-----------|-------|
| Governance Token | KNOW |
| Proposal Threshold | 100 KNOW |
| Voting Period | 7 days |
| Quorum | 4% of total supply |
| Timelock | 2 days |
| Network | Sepolia Testnet |

## Contract Addresses

| Contract | Address |
|----------|---------|
| GovernanceToken | `{{ site.Params.daoTokenAddress }}` |
| ProposalEngine | `{{ site.Params.daoEngineAddress }}` |
| SoulboundToken | `{{ site.Params.daoSbtAddress }}` |
