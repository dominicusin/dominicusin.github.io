# Makefile — standardized local dev + CI-parity commands for dominicusin.github.io
# Repo is "type": "module"; these shell out to node/hugo explicitly.

HUGO ?= hugo
PORT ?= 1313

.PHONY: help install serve build build-preview lint test test:src test:dao \
        contract kg e2e clean

help: ## Show this help
	@echo "Targets:"
	@sed -n 's/^\([a-zA-Z:_-]\+\):.*## //p' $(MAKEFILE_LIST)

install: ## Install Node deps (npm ci)
	npm ci

serve: ## Run Hugo dev server with live reload
	$(HUGO) server --bind 0.0.0.0 --port $(PORT) --baseURL http://localhost:$(PORT)/

build: ## Build the site to ./public (production)
	$(HUGO) --gc --minify

build-preview: ## Build without minify (faster local check)
	$(HUGO)

lint: ## Lint scripts (eslint over src/ and scripts/)
	npm run lint

test: ## Run JS unit tests (jest)
	npm test

test:src: ## Run engineering-plane tests (jest, src/ + scripts/)
	npx jest --config jest.config.js src scripts

test:dao: ## Run Hardhat DAO contract tests
	npx hardhat test

contract: ## Validate frontmatter of changed posts (content-contract, soft)
	node scripts/ci-content-contract.cjs

kg: ## Regenerate the Knowledge Graph JSON-LD
	node scripts/build-knowledge-graph.cjs

e2e: ## Run Playwright E2E (requires: npx playwright install chromium)
	npx playwright test

clean: ## Remove generated output
	rm -rf public resources .hugo_build.lock
