# 03-validation: Quality Gates

**Load this layer when the task involves: writing tests, mocks, test utilities, coverage, or CI quality.**

This layer defines how we prove code works. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **Unit Tests** → Read `unit-tests.md`
  - Mandatory when: writing or modifying unit tests, mocks, or test utilities
  - Covers: AAA pattern, mocking rules, assertion style, coverage expectations
  - CLI-specific: mocking inquirer prompts, filesystem testing, test isolation

- **E2E Tests** → Read `e2e-tests.md`
  - Mandatory when: writing or modifying end-to-end or integration tests
  - Covers: selector rules, test data, environment boundaries

## Layer Rules

- Every production code change MUST have corresponding test coverage
- Tests MUST be deterministic: same input always produces same result
- Never use live network, real databases, or external services in unit tests
- CLI tests require mocking interactive prompts (inquirer) and filesystem operations
- All CLI commands must have test coverage for: happy path, user decline, existing files, idempotency
