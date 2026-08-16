# Site Ontology & Taxonomy

This document defines the controlled vocabulary used to classify every page on
`dominicusin.github.io`. It is the conceptual backbone of the
[Knowledge Graph](../knowledge-graph/) and the `/categories/` + `/tags/` hubs.

## Model

```
Domain (category)  ──subsumes──▶  Topic (tag)
        │                              │
        └────────── relatedTo ─────────┘   (cross-domain links)
                  Post ──tagged──▶ Topic
                  Post ──filed───▶ Domain
```

- **Category** = top-level *content domain* — what kind of artifact this is.
  Each post carries **exactly one** category (a few cross-domain posts get two).
- **Tag** = cross-cutting *topic / technology / theme* — a post carries **2–4**.
  Tags are shared across categories, which is what makes the graph connect.
- **Relations** (expressed in the Knowledge Graph):
  - `category → subsumes → tag` (a domain owns the topics that live inside it)
  - `post → tagged → tag`, `post → filed → category`
  - `category → relatedTo → category` (manual, high-level bridges)

## Categories (domains)

| Key | RU label | Scope |
|-----|----------|-------|
| `notes` | Заметки | Personal/sysadmin working notes, workstation setup, gists, how-tos |
| `links` | Подборки ссылок | Curated link collections / awesome-lists / resource roundups |
| `security` | Безопасность | Privacy, cryptography, anonymity, threat modeling |
| `ai` | ИИ | AI/ML tools, applications, prompting |
| `systems` | Системы | OS, distributed systems, Plan9, low-level, networking |
| `web` | Веб | Web dev, self-hosting, decentralization, tunneling |
| `career` | Карьера | CV, interviews, professional development |
| `philosophy` | Философия | Essays on logic, practice, craft |
| `dao` | DAO | Decentralized governance / smart contracts (engineering focus) |
| `media` | Медиа | Movies / books lists |

## Tags (topics)

Tags are technology / theme facets. The canonical set grows as content does, but
the stable core is:

`linux` · `macos` · `windows` · `networking` · `self-hosting` · `privacy` ·
`tor` · `cryptography` · `ml` · `llm` · `prompting` · `plan9` · `neovim` ·
`devops` · `interview` · `awesome-list` · `decentralization` ·
`smart-contracts` · `governance` · `commit-reveal` · `books` · `movies` ·
`productivity` · `automation` · `free-resources`

## Applying the vocabulary

- Posts are classified by editing their front matter (`categories:`, `tags:`).
- The Knowledge Graph generator (`scripts/build-knowledge-graph.cjs`) turns
  every category and tag into a `concept` node and draws `subsumes` edges from
  each category to the tags that appear inside its posts — so the concept layer
  is a real hierarchy, not just co-occurrence.
- `docs/ROADMAP_STATUS.md` tracks coverage; the goal is **0 posts without a
  category and ≤ 1 tag**.
