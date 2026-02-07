<p align="center">
  <img src="docs/icon.png" alt="revu icon" width="128" height="128">
</p>

# revu

A desktop Git diff reviewer with inline commenting, designed for local code review workflows with AI coding agents.

<p align="center">
  <img src="docs/screenshot-dark.png" alt="revu screenshot" width="800">
</p>

## Why revu?

AI coding agents like Claude Code, OpenCode, and Codex work directly in your local environment - modifying files in real-time before any commit or push. Traditional GitHub PR reviews don't fit this workflow. You need to review changes _locally_, provide feedback, and guide the agent's next turn.

revu bridges this gap: a desktop review interface that exports structured feedback agents can consume.

Inspired by [Conductor](https://www.conductor.build/)'s working directory review feature.

## Features

- **Unified and split diff views** - syntax highlighting with word-level change detection
- **Inline comments** - add categorised feedback to lines or selections
- **Stage/unstage files** - manage staging and create commits directly
- **Export for Agent** - exports review and copies the file path to clipboard for agent use
- **CLI integration** - open with `revu /path/to/repo`

## Comment Categories

| Category       | Colour | Meaning                                     |
| -------------- | ------ | ------------------------------------------- |
| **issue**      | Red    | Bug or error - must be fixed                |
| **suggestion** | Blue   | Improvement - implement unless problematic  |
| **question**   | Purple | Clarification needed - agent should explain |
| **nitpick**    | Yellow | Minor preference - fix if easy              |
| **praise**     | Green  | Positive feedback - no change needed        |

## Installation

### Homebrew (Recommended)

```bash
brew install eddmann/tap/revu
```

### Manual Download

Download the latest release from [GitHub Releases](https://github.com/eddmann/revu/releases):

- **macOS:** `.dmg` (Apple Silicon and Intel)
- **Linux:** `.AppImage` or `.deb`

### Build from Source

```bash
git clone https://github.com/eddmann/revu.git
cd revu
bun install
bun run tauri build

# Copy to Applications (macOS)
cp -r src-tauri/target/release/bundle/macos/revu.app /Applications/
```

## Usage

### Standalone

Open revu and browse to a Git repository, or launch from the command line:

```bash
revu /path/to/repo
```

### With Coding Agents

1. Run `! revu .` in your agent to open revu with the current repo
2. Review changes and add comments by clicking on lines
3. Click "Export for Agent" when done — the file path is copied to your clipboard
4. Reference the exported review in your agent with `@{paste path}`

The review is saved to `~/.revu/{repo-name}-{timestamp}.md`.

## Review Format

When you click "Export for Agent", revu writes a structured XML file that agents can parse:

```xml
<revu-review>
<review-summary>
Total: 3 comments
Action required: 2 (1 issue, 1 suggestion)
</review-summary>

<comment id="1">
<file>src/App.tsx</file>
<line>42</line>
<side>new</side>
<category>issue</category>
<code language="tsx">
const value = props.data
</code>
<text>This will crash if props.data is undefined</text>
</comment>
</revu-review>
```

## Development

```bash
git clone https://github.com/eddmann/revu.git
cd revu
make install    # Install dependencies
make dev        # Start development server
make build      # Build production app
make fmt        # Format all code
make lint       # Run linting checks
```

**Prerequisites:**

- Bun
- Rust toolchain
- Tauri CLI (`bun add -g @tauri-apps/cli`)

## Tech Stack

React 19, TypeScript, Tailwind CSS 4, Zustand, Tauri 2, Rust, libgit2, Vite 7, Bun

## License

[MIT](LICENSE)
