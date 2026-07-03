# CLI Architecture Rail

## Core Principles
- Single-purpose commands: each command does ONE thing
- Interactive when needed, silent when possible
- Never overwrite existing user configs without explicit consent
- TypeScript with strict mode for compile-time safety

## Project Structure

```
cli/
├── src/
│   ├── index.ts              # Entry point, command registration
│   ├── commands/
│   │   ├── add.ts             # Add RAILGUN to project
│   │   ├── init.ts            # Wizard with presets
│   │   └── remove.ts         # Remove RAILGUN
│   ├── utils/
│   │   ├── ascii.ts          # ASCII art, colors, emoji
│   │   └── messages.ts       # Loading steps, config notices
│   └── templates/             # Preset configurations
│       ├── react.ts
│       ├── vue.ts
│       ├── python.ts
│       └── golang.ts
├── dist/                      # Compiled output (gitignored)
├── __tests__/                   # Jest tests
└── package.json
```

## Dependencies
- `commander` — CLI argument parsing
- `inquirer` — Interactive prompts
- `chalk` — Terminal colors (pink theme: `#FF69B4`)
- `fs-extra` — Filesystem operations with promises

## Color Scheme (Pink Theme)
- Primary: `#FF69B4` (hot pink) for headers, banners, boxes
- Success: `chalk.green` for confirmations
- Warning: `chalk.yellow` for alerts
- Info: `chalk.blue` for neutral info
- Gray: `chalk.gray` for secondary text

## State Management (CLI is Stateless)
- No persistent state between commands
- Each command reads filesystem fresh
- No caching of project analysis results
- Deterministic: same input → same output

## Error Handling
- Graceful exits with exit code 0 (no error) or 1 (error)
- Never throw uncaught exceptions to user
- Always show helpful message before exiting
- Preserve existing files on any failure

## Command Patterns

### Add Command Flow
1. Show confirmation prompt with link to repo
2. If confirmed: analyze project structure (1s pause)
3. Detect existing AI configs (1s pause)
4. Ask integration mode (Auto/Manual/Skip)
5. Execute based on mode
6. Show success message + config notice

### Init Command Flow
1. Show wizard intro
2. List presets with descriptions
3. Call `addCommand()` internally
4. Overlay preset-specific files
5. Show success with preset name

### Remove Command Flow
1. Check if `.railgun/` exists
2. Remove directory
3. Smart AGENTS.md cleanup (only if contains only activation)
4. Confirm removal

## Forbidden Patterns
- Overwriting existing `.cursorrules`, `CLAUDE.md`, `AGENTS.md`
- Running without confirmation in non-empty projects
- Hardcoded paths (always use `process.cwd()`)
- Synchronous filesystem operations (always `async/await`)
- Leaving temp files or partial state on failure
