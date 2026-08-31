# Contributing to dominicusin.github.io

## Quick Start

```bash
# 1. Clone
git clone https://github.com/dominicusin/dominicusin.github.io.git
cd dominicusin.github.io

# 2. Install deps
npm install

# 3. Build
npm run build

# 4. Test
npm test

# 5. Serve locally
npm run start
```

## Project Structure

```
├── assets/
│   ├── css/
│   │   ├── neo.css          # Neo design system (main CSS)
│   │   └── critical/        # Above-fold critical CSS
│   └── js/
│       └── custom.js        # All client-side JS
├── content/                 # Hugo content (blog, repos, gists, awesome)
│   ├── blog/
│   ├── repositories/
│   ├── gists/
│   └── awesome/
├── data/                    # Hugo data files (JSON)
├── layouts/
│   ├── _default/            # Default templates
│   ├── partials/            # Reusable partials
│   │   ├── neo-head.html    # <head> with SEO + performance
│   │   ├── neo-store.html   # Centralized localStorage
│   │   ├── content-graph.html # Related posts + tags
│   │   └── neo-subscribe.html # Newsletter + share
│   ├── shortcodes/          # Hugo shortcodes
│   └── analytics/           # Dashboard templates
├── static/                  # Static files (served as-is)
│   ├── sw.js                # Service Worker
│   ├── manifest.webmanifest # PWA manifest
│   └── .well-known/security.txt
├── scripts/                 # Build scripts
└── tests/                   # Test suites
    ├── unit/                # Unit tests
    ├── a11y/                # Accessibility
    └── e2e/                 # End-to-end
```

## Development Workflow

### Branch Naming
- `feat/waveXX-feature-name` — new features
- `fix/issue-description` — bug fixes
- `chore/task-name` — maintenance

### Pull Request Process
1. Create feature branch from `main`
2. Make changes, verify locally: `npm run build && npm test`
3. Push and create PR
4. Quality CI must pass (build → validate → test → link-check)
5. Merge via `gh pr merge --squash --admin`

### Code Style
- **CSS**: Use Neo design tokens (`--bg`, `--text`, `--accent`)
- **JS**: Use IIFE pattern, avoid global scope pollution
- **HTML**: Use semantic elements, ARIA labels

## Testing

```bash
# All tests
npm test

# Unit tests only
npx jest tests/unit

# With coverage
npm run test:coverage
```

## Design System

### Themes
Switch via `data-theme` attribute on `<html>`:
- `dark` (default)
- `light`
- `solar`
- `mono`
- `dracula`

### Accents
Switch via `data-accent` attribute:
- `teal` (default)
- `violet`
- `amber`
- `emerald`
- `rose`

### Key Classes
- `.neo-card` — content cards
- `.neo-row` — list items
- `.neo-post` — article wrapper
- `.neo-wrap` — content container
- `.neo-sec-head` — section header

## Architecture Decisions

1. **No backend** — static site on GitHub Pages
2. **localStorage** — centralized in `neoStore` (neo-store-v1)
3. **Critical CSS** — inline above-fold, async rest
4. **Search** — build-time index, client-side fuzzy match
5. **Analytics** — local only, no external tracking
