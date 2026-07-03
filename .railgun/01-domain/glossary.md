# Glossary: Ubiquitous Language

This file defines the canonical vocabulary of the product. Every name in the codebase MUST come from this list.

## How to use this file
- When naming anything (variable, function, table, endpoint), find the concept here first
- If the concept does not exist, add it here BEFORE using it in code
- Never use synonyms, abbreviations, or alternative spellings for defined terms

## RAILGUN System Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Rail** | A single focused `.md` file containing rules for one concern | "rule file", "doc", "guide" |
| **Layer** | A numbered directory (`00`–`04`) grouping related rails | "folder", "category", "section" |
| **Dispatcher** | The `AGENTS.md` inside a layer that tells AI which rails to load | "index", "router", "map" |
| **Preset** | Pre-configured set of rails for a specific tech stack (React, Vue, Python, Go) | "template", "boilerplate", "starter" |
| **Wizard** | Interactive CLI flow that asks questions and configures project | "interactive mode", "setup flow" |
| **Integration Mode** | How RAILGUN combines with existing AI configs: Auto, Manual, Skip | "merge strategy", "setup type" |

## CLI Tool Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Command** | A CLI sub-command (`add`, `init`, `remove`) | "action", "operation" |
| **Scaffold** | The process of creating `.railgun/` directory structure | "generate", "setup", "install" |
| **Activation** | The header added to AGENTS.md to trigger RAILGUN reading | "hook", "trigger", "init" |
| **Existing Config** | AI config files already in project (CLAUDE.md, .cursorrules, etc.) | "legacy config", "old rules" |

## Actions / Operations

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Apply** | Add RAILGUN to a project (run `railgun add`) | "install", "setup", "enable" |
| **Remove** | Delete `.railgun/` and optionally clean AGENTS.md | "uninstall", "delete", "purge" |
| **Analyze** | CLI scanning project structure and existing configs | "scan", "detect", "inspect" |
| **Overlay** | Adding preset-specific files on top of base structure | "merge", "inject", "append" |

## Value Objects / Types

| Canonical Term | Definition | Examples |
|----------------|------------|----------|
| **Rail File** | `.md` file inside a layer | `state-management.md`, `unit-tests.md` |
| **Layer ID** | Two-digit prefix + name | `00-runtime`, `01-domain`, `02-blueprint` |
| **Config File** | AI-specific configuration file | `.cursorrules`, `CLAUDE.md`, `AGENTS.md` |
| **Preset Key** | Short identifier for preset | `react`, `vue`, `python`, `golang` |
