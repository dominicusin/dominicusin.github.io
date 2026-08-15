---
title: "Projects"
slug: "projects"
description: "Engineering work behind the site — DAO contracts, the Knowledge Graph pipeline, and the research substrate in src/."
menu:
  main:
    name: "Projects"
    weight: 100
---

This site is also an **engineering portfolio**. The publishing layer (Hugo /
Blowfish) is intentionally thin; the substance lives in the Engineering Plane,
documented under `docs/adr/0002-two-plane-architecture.md`.

## Decentralized Governance (DAO)

Solidity contracts for experiment-driven governance — a governance token, a
soulbound identity badge, and a commit-reveal proposal engine.

- Source: [`contracts/dao/`](https://github.com/dominicusin/dominicusin.github.io/tree/main/contracts/dao)
- Tests: Hardhat, 9 passing (`npx hardhat test`)
- Roadmap & threat model: [DAO Roadmap](/dao/)

## Knowledge Graph pipeline

Every build turns published content into a JSON-LD graph
(`static/data/knowledge-graph.json`) rendered by the
[Knowledge Graph](/knowledge-graph/) explorer.

- Generator: [`scripts/build-knowledge-graph.cjs`](https://github.com/dominicusin/dominicusin.github.io/tree/main/scripts)
- Schema: `schema/post-metadata.schema.json`

## Research substrate (`src/`)

Reusable modules — P2P/CRDT experiments, vector search, RUM/analytics, PWA
service worker. Not imported by Hugo at build time; integrated only through
generated artifacts and demo pages.

- Browse: [`src/`](https://github.com/dominicusin/dominicusin.github.io/tree/main/src)

## Reproducible pipeline

The whole process — content-contract gate, build, tests, deploy — runs through
GitHub Actions. See the [README](https://github.com/dominicusin/dominicusin.github.io#-cicd-single-publisher-model)
for the workflow map.
