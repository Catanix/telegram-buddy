# RAILGUN Command Center

You are operating inside a RAILGUN-controlled repository.

## Meta-Rules (How you MUST interact with RAILGUN)

- You must cite which rails you used in your reasoning or commit messages
- If a rail contradicts your training data, the rail ALWAYS wins
- You must follow the execution loop below for EVERY task, without exception

## Task Lifecycle Lock

You MUST treat every task as a three-phase lifecycle. Do not skip phases.

### Phase 1: Discovery
Before writing ANY code:
1. Read root `AGENTS.md` (automatic)
2. Read `.railgun/AGENTS.md` (this file)
3. Read `00-runtime/AGENTS.md` and `current.md`
4. Use Task-to-Layer Matrix below to identify relevant layers
5. Read each relevant layer's `AGENTS.md` dispatcher
6. Read the specific rails referenced by dispatchers
7. **STOP and confirm:** Explicitly list which rails you have loaded and will follow

### Phase 2: Execution
Write code in strict compliance with loaded rails only.

### Phase 3: Final Gate (NON-NEGOTIABLE)
Before saying "done", "finished", "complete", or declaring success:
1. Read `04-guardrails/AGENTS.md`
2. Read `04-guardrails/checklist.md`
3. Explicitly confirm EACH checklist item applicable to your task
4. Fix any failures immediately
5. Only then declare the task complete

You are FORBIDDEN from declaring completion before Phase 3.

## Execution Loop (MANDATORY)

For EVERY task, follow this order:

1. **Runtime Check** → Read `00-runtime/AGENTS.md`
   - Check for active sprints, code freezes, or temporary workarounds
2. **Task Classification** → Use the Task-to-Layer Matrix below to decide which layer(s) apply
3. **Load Layer Dispatcher** → Open the `AGENTS.md` in the matched layer(s)
4. **Load Relevant Rails** → Open ONLY the specific `.md` files referenced by the layer dispatcher
5. **Execute** → Write code in strict compliance with loaded rails
6. **Self-Validation** → Run through `04-guardrails/checklist.md` before finishing

## Task-to-Layer Matrix

| If your task involves... | Go to Layer | Dispatcher to Read |
|--------------------------|-------------|--------------------|
| Sprint status, active tasks, code freezes, temporary workarounds, "what is the team doing now" | `00-runtime` | `00-runtime/AGENTS.md` |
| Business entities, naming variables/functions, data models, validation rules, workflows, glossary | `01-domain` | `01-domain/AGENTS.md` |
| State management, routing, architecture, patterns, libraries, file structure, framework usage | `02-blueprint` | `02-blueprint/AGENTS.md` |
| Unit tests, E2E tests, mocking, test data, coverage, CI quality gates | `03-validation` | `03-validation/AGENTS.md` |
| Security review, secrets, input validation, commit format, pre-commit checks, self-review | `04-guardrails` | `04-guardrails/AGENTS.md` |

**Multi-layer tasks:** If a task spans layers (e.g., "build payment form with tests"), load ALL relevant layers sequentially. Start with `01-domain` (what to build), then `02-blueprint` (how to build), then `03-validation` (how to test), and finish with `04-guardrails` (checklist).

**When in doubt:** Load `01-domain` for naming and `02-blueprint` for implementation. Ask the human if you are still unsure.

## Editing / Updating RAILGUN

You MAY modify files inside `.railgun/` ONLY when explicitly requested by a human or when the human shares information that clearly belongs in a specific layer.

### Rules for Editing RAILGUN

1. **Identify the target layer** using the Task-to-Layer Matrix above
2. **Update the specific rail file** (e.g., `02-blueprint/state-management.md`) — never dump unrelated rules into the wrong layer
3. **Update the layer's `AGENTS.md` dispatcher** if you add a new rail file — the dispatcher must list all available rails in that layer
4. **Update the layer's `README.md`** if the purpose or structure of the layer changes
5. **You MAY proactively update `00-runtime/current.md`** when the human shares new sprint info, blockers, or priorities during a conversation — this is the only layer you may update without an explicit request
6. **Never delete, rename, or skip existing layers** (00–04) without explicit human approval
7. **If adding a completely new cross-cutting concern** (e.g., a new architectural domain like `machine-learning` or `analytics`), propose the structure to the human rather than inventing a new layer

### Adding New Rails

For detailed validation protocol when creating new rails, read `.railgun/rail-protocol.md`.

## Rules for Navigating RAILGUN

- Do NOT read all rails at once. Load only what the current task requires.
- Always respect the Read-Only nature of layers during normal development. They are immutable unless the human explicitly asks for a change.
- If you are unsure which layer applies, ask the human for clarification rather than guessing.
