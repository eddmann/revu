# AGENTS.md

## Project Overview

Desktop Git diff reviewer with inline commenting. Tauri 2 app with React 19 frontend (TypeScript, Vite 7, TailwindCSS 4, Zustand) and Rust backend (git2 for Git operations).

## Setup

```bash
# Install dependencies (requires Bun and Rust toolchain)
make install

# Start development server
make dev
```

## Common Commands

| Task           | Command                           |
| -------------- | --------------------------------- |
| Install deps   | `make install`                    |
| Dev server     | `make dev`                        |
| Build          | `make build`                      |
| Build (target) | `make build/aarch64-apple-darwin` |
| Format         | `make fmt`                        |
| Lint           | `make lint`                       |
| CI checks      | `make can-release`                |

## Code Conventions

**Directory structure:**

- `src/` - React frontend (TypeScript)
- `src/components/ui/` - Reusable UI primitives
- `src/features/` - Feature modules (comments, diff, files, theme)
- `src/stores/` - Zustand stores (gitStore, commentStore, uiStore)
- `src/types/` - TypeScript type definitions
- `src-tauri/` - Rust backend
- `src-tauri/src/commands/` - Tauri IPC handlers
- `src-tauri/src/git/` - Git abstraction layer

**Import alias:** `@/` maps to `src/`

**State management:** Zustand stores with TypeScript interfaces

**TypeScript:** Strict mode enabled, no unused locals/parameters

## Tests & CI

No unit test framework. CI validates linting only.

**CI workflow:** Runs on push/PR to `main`

- Frontend: `bun run lint` (ESLint)
- Backend: `cargo fmt --check && cargo clippy -- -D warnings`

**Run all checks locally:**

```bash
make can-release
```

## PR & Workflow Rules

**Commit format:** Conventional commits

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `refactor:` code restructuring
- `chore:` maintenance

**Branch:** `main` is primary branch

**Releases:** Manual trigger via GitHub Actions, version sourced from `CHANGELOG.md`

## Security & Gotchas

**Never commit:**

- `.env`, `.env.local`
- `node_modules/`, `dist/`, `src-tauri/target/`

**No env vars required** - all config is in code or Tauri config

**Path alias:** Use `@/` prefix for imports from `src/` (e.g., `@/stores/gitStore`)

**Tauri commands:** IPC handlers in `src-tauri/src/commands/` must be registered in `src-tauri/src/lib.rs`

**Git operations:** Use the `git2` crate wrapper in `src-tauri/src/git/repository.rs`
