# 02-blueprint: Engineering Skeleton

**Load this layer when the task involves: state management, routing, architecture, patterns, libraries, file structure, or CLI tools.**

This layer defines HOW code must be written. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **State Management** → Read `state-management.md`
  - Mandatory when: reading/writing global or local state, stores, or data flow
  - Covers: mutation rules, store patterns, caching strategies

- **Routing & Navigation** → Read `routing.md`
  - Mandatory when: adding/modifying routes, navigation flows, or entry points
  - Covers: lazy-loading, guards, access control, deep-linking

- **CLI Architecture** → Read `cli-architecture.md`
  - Mandatory when: modifying RAILGUN CLI commands, presets, or interactive flows
  - Covers: command structure, dependencies, color scheme, testing patterns

## Layer Rules

- All code MUST follow established patterns in the rails above
- If your task touches both state and routing, read BOTH rails
- Never introduce a new pattern without loading the relevant rail first
- When modifying CLI, always read `cli-architecture.md` before writing code
- CLI changes require explicit user confirmation before modifying project files
