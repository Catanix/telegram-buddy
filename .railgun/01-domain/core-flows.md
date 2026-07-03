# Core Business Flows

This file maps multi-step transactional processes. Implementations MUST match these sequences.

## How to use this file
- Before implementing a flow, read its definition here
- Do not skip steps, reorder them, or add undocumented side effects
- If a flow needs to change, update this file first

## Flow Template

### Flow: <Name>
**Trigger:** <What starts this flow>
**Actors:** <User, system, external service>

1. **Step 1:** <Action>
   - Pre-condition: <What must be true>
   - Post-condition: <What becomes true>
   - Side effects: <What else happens>
2. **Step 2:** <Action>
   - ...
3. **Step N:** <Action>

**Rollback:** <How to undo if a later step fails>
**Idempotency:** <Is this flow safe to retry?>
