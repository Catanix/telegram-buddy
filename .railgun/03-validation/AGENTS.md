# 03-validation: Quality Gates

**Load this layer when the task involves: writing tests, mocks, test utilities, coverage, or CI quality.**

This layer defines how we prove code works. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **Testing Plan** → Read `testing-plan.md`
  - Mandatory when: releasing or verifying functionality
  - Covers: manual test checklist, regression tests, platform verification
  - Notes: Project has no automated test suite — testing is manual via bot interaction

## Layer Rules

- All code changes MUST be manually tested before release
- Manual testing follows the checklist in `testing-plan.md`
- Never release without verifying all platforms (TikTok, Instagram, YouTube, X)
- After Docker changes, verify `docker compose build` and `docker compose up`
