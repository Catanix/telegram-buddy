# E2E Testing Rail

## Scope
- End-to-end tests verify complete user flows across the full application stack
- They exercise real routing, state transitions, and integration points
- They do NOT replace unit tests; they complement them

## Test Data & Environment
- Use dedicated test environments or sandboxed accounts
- Seed data explicitly before each test; never rely on leftover state from previous runs
- Clean up created data after tests complete

## Selectors & Stability
- Prefer stable selectors over brittle XPath or positional queries
- Use semantic attributes (`data-testid`) or accessible labels rather than CSS classes or DOM structure
- If a selector must change for styling reasons, the test should not break

## Isolation
- Each test MUST be independent: setup, execute, teardown
- Parallel execution MUST be safe; tests must not compete for the same resources
- Never hardcode waits or sleep timers; use explicit conditions or retry logic

## Boundaries
- E2E tests should not test edge cases exhaustively — that is the job of unit tests
- Focus on critical user paths: authentication, checkout, core workflows
