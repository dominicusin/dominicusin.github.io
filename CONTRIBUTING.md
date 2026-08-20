# Contributing

Thank you for your interest in contributing to this project! This document provides
guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Building](#building)
- [Pull Requests](#pull-requests)
- [Commit Messages](#commit-messages)
- [Style Guide](#style-guide)
- [Security](#security)

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold this code. Please report unacceptable behavior to dominicusin@proton.me.

## Getting Started

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dominicusin.github.io.git
   ```
3. Create a branch for your changes:
   ```bash
   git checkout -b my-feature-branch
   ```

## Development Setup

### Prerequisites

- Node.js 24.x or higher (check with `node --version`)
- Hugo 0.164.0 or higher (for site building)
- npm 11.x or higher (check with `npm --version`)

### Install Dependencies

```bash
npm ci
```

This will install all dependencies listed in `package.json`.

## Running Tests

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### E2E Tests

Run Playwright E2E tests:
```bash
npm run test:e2e
```

For local development, you may need to start the Hugo dev server first:
```bash
npm run start
```

### Linting

Run ESLint:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

## Building

### Development Build

Build for local development:
```bash
npm run build
```

### Production Build

Build for production (with proper base URL):
```bash
npm run build:production
```

### Full Build (with GitHub sync)

Complete build including GitHub repos/gists sync:
```bash
npm run build:full
```

## Pull Requests

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure linting passes: `npm run lint`
3. Update documentation if needed
4. Add tests for new functionality
5. Follow the commit message convention

### PR Process

1. Push your changes to your fork
2. Create a Pull Request from your fork to the main repository
3. Fill out the PR template completely
4. Request review from maintainers
5. Address any feedback

### PR Requirements

- All tests must pass
- Code must follow the style guide
- Changes must be documented
- Breaking changes require approval from maintainers

## Commit Messages

We follow conventional commits:

```
type(scope): description

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependency
- `ci`: CI/CD changes
- `chore`: Other changes that don't affect src or test
- `revert`: Reverting a previous commit

Example:
```
feat(content): add new post about systems engineering

Add comprehensive guide on microservices architecture patterns.
Includes diagrams and best practices.

Closes #123
```

## Style Guide

### JavaScript/ESLint

- Use ESLint with the project's configuration
- Prefer `const` over `let`
- No unused variables (prefix with `_` if intentionally unused)
- No `var` declarations

### Markdown

- Use descriptive headings
- Write in clear, concise language
- Link to related documentation
- Use code blocks for code examples

### JSON/YAML

- Sort keys alphabetically
- Use 2 spaces for indentation
- Quote all string values
- No trailing commas

## Security

Security is a priority. By participating, you agree to:

1. Report security vulnerabilities through GitHub's private vulnerability reporting
2. Not exploit vulnerabilities publicly without permission
3. Follow responsible disclosure practices

See our [Security Policy](SECURITY.md) for details on reporting vulnerabilities.

## Questions or Help?

If you have questions about contributing, please open an issue with the
`question` label, or contact dominicusin@proton.me.

Thank you for contributing! 🎉