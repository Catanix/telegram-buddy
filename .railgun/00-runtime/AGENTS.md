# 00-runtime: Dynamic Memory

**Load this layer FIRST for every task.**

This layer contains temporary facts about the current sprint that override all other layers.

## What to check

- `current.md` — Active sprint tasks, modules in refactoring, known blockers, temporary workarounds

## Rules

- Runtime rules ALWAYS win over blueprint, domain, validation, and guardrails
- If something in runtime contradicts a permanent rail, follow runtime and report the conflict
- Never assume runtime is empty — always check it
- You MAY update `current.md` proactively when the human shares new sprint info, blockers, or priorities
