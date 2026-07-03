# 02-blueprint: Engineering Skeleton

**Load this layer when the task involves: state management, routing, architecture, patterns, libraries, file structure, or CLI tools.**

This layer defines HOW code must be written. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **Bot Architecture** → Read `bot-architecture.md`
  - Mandatory when: modifying handlers, services, middleware, or bot structure
  - Covers: handler order, service isolation, error handling, project structure

- **Handler Chain** → Read `handler-chain.md`
  - Mandatory when: adding/modifying handlers or command routing
  - Covers: registration order, guards, access control, callback actions

## Layer Rules

- All code MUST follow established patterns in the rails above
- If your task touches both state and routing, read BOTH rails
- Never introduce a new pattern without loading the relevant rail first
- When modifying CLI, always read `cli-architecture.md` before writing code
- CLI changes require explicit user confirmation before modifying project files
