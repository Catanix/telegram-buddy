# State Management Rail

## Core Principles
- Single source of truth: every piece of state has one canonical owner
- State should be minimal: derive values via selectors or computed properties, do not duplicate
- Immutability: never mutate state directly; always produce new references

## Global State
- Use a centralized store for state that crosses module boundaries
- Actions MUST be explicit and traceable (named functions/methods, not anonymous mutations)
- Side effects (API calls, async logic) MUST live outside the store or in dedicated middleware

## Local State
- Keep local state as close to the consumer as possible
- Lift state up only when truly shared by siblings or deeply nested components
- Prefer derived state over synchronized state

## Forbidden Patterns
- Direct mutation of store state outside of defined actions
- Storing derived/calculable data in state
- Mixing UI state (loading, modal open) with domain state in the same store without namespacing
