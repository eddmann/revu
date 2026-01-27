.DEFAULT_GOAL := help

.PHONY: *

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z\/_%-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

install: ## Install all dependencies
	bun install

dev: ## Start development server
	bun tauri dev

build: ## Build production app
	bun tauri build

build/%: ## Build for specific target (e.g., build/x86_64-apple-darwin)
	bun tauri build --target $*

fmt: ## Format all code
	bun run lint --fix || true
	cd src-tauri && cargo fmt

##@ Testing/Linting

can-release: lint ## Run all CI checks (lint)

lint: lint/frontend lint/backend ## Run all linting

lint/frontend: ## Lint TypeScript/React code
	bun run lint

lint/backend: ## Lint Rust code
	cd src-tauri && cargo fmt --check
	cd src-tauri && cargo clippy -- -D warnings
