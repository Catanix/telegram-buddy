# 03-validation: Quality Gates

**Load this layer when the task involves: writing tests, mocks, test utilities, coverage, or CI quality.**

This layer defines how we prove code works. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **Unit Tests** → Read `unit-tests.md`
  - Mandatory when: writing or modifying unit tests, mocks, or test utilities
  - Covers: AAA pattern, mocking rules, assertion style, coverage expectations
  - Bot-specific: mocking Telegraf ctx, Playwright, yt-dlp, database

- **E2E Tests** → Read `e2e-tests.md`
  - Mandatory when: writing or modifying end-to-end or integration tests
  - Covers: Telegram Bot API testing, Docker test environment, message polling

## Layer Rules

- Every production code change MUST have corresponding test coverage
- Tests MUST be deterministic: same input always produces same result
- Never use live network, real databases, or external services in unit tests
- Bot tests require mocking Telegraf context, Playwright, and yt-dlp
- All download services must have test coverage for: happy path, invalid URL, network failure, file cleanup
