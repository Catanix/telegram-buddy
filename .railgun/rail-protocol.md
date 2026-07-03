# Rail Protocol: Safely Adding New Rules to RAILGUN

This file defines the mandatory process for adding, modifying, or removing rails. Follow it exactly when the human asks you to extend RAILGUN.

## When to Use This Protocol

Use this protocol ONLY when:
- The human explicitly asks you to add a new rule, rail, or layer
- The human asks you to modify an existing rail
- The human asks you to validate a proposed rule

## Step 1: Validate the Need

Before creating anything:
1. Ask the human: "Which layer should this belong to?" If unsure, use the Task-to-Layer Matrix in `.railgun/AGENTS.md`
2. Check if an existing rail already covers this concern. Read ALL rails in the target layer.
3. If the concern is 80% covered by an existing rail, UPDATE the existing rail rather than creating a new file.

## Step 2: Choose the Correct Layer

Use this decision tree:

- Is it about current sprint / temporary rules? → `00-runtime/current.md`
- Is it about business entities / naming / models / flows? → `01-domain/`
- Is it about HOW to write code (patterns, libraries, architecture)? → `02-blueprint/`
- Is it about testing / quality / proof? → `03-validation/`
- Is it about security / delivery / checklists? → `04-guardrails/`

**Forbidden:** Never create a rail outside these five layers. Never put a testing rule in `02-blueprint`. Never put an architectural pattern in `01-domain`.

## Step 3: Write the Rail

Every new rail file MUST follow this structure:

```markdown
# [Name] Rail

## Core Principles
- 2-5 high-level rules

## Allowed
- Explicitly permitted patterns

## Forbidden
- Explicitly prohibited patterns

## Examples (if needed)
- Brief, dense examples (not full code blocks)
```

### Quality Checks for New Rails
- [ ] The rail is DRY (no duplication with existing rails)
- [ ] The rail uses imperative language ("You MUST", "It is forbidden to", "Always...")
- [ ] The rail contains no essay-style explanations — only bullets
- [ ] The rail contains no full code snippets (pseudocode only if absolutely necessary)
- [ ] The rail covers exactly ONE concern (not "state management AND testing")
- [ ] The rail does not contradict any other layer

## Step 4: Update the Dispatcher

After creating the rail file:
1. Open the layer's `AGENTS.md` dispatcher
2. Add an entry to the Navigation Map with:
   - Rail name and link
   - "Mandatory when:" condition
   - "Covers:" brief description
3. Update the Layer Rules section if the new rail introduces a global constraint

## Step 5: Validate the Ecosystem

After adding the rail:
1. Check all OTHER layers for potential contradictions
2. Check `00-runtime/current.md` for temporary overrides that might conflict
3. Confirm the root `AGENTS.md` Task-to-Layer Matrix still accurately describes the layer

## Step 6: Report to Human

Present the human with:
- Which layer you placed the rail in
- The file name and path
- Which dispatcher you updated
- Confirmation that no contradictions were found (or warnings if any)
