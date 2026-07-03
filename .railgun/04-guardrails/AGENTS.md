# 04-guardrails: Security & Delivery

**Load this layer LAST, before finishing any task. Also load it when the task involves: security, secrets, authentication, commit formatting, or CLI development.**

This layer defines what must be checked before any work is considered complete. Read-Only for AI during normal development.

## Non-Negotiable Completion Rule

You CANNOT declare a task complete, finished, or done until you have:
1. Read `checklist.md`
2. Explicitly confirmed EACH applicable checklist item
3. Fixed any identified issues

There are no exceptions. "I will fix it later" is forbidden. Fix it NOW.

## Navigation Map

Pick the rail that matches your task:

- **Pre-Commit Checklist** → Read `checklist.md`
  - Mandatory when: BEFORE declaring any task complete or committing code
  - Covers: self-review steps, commit format, console.log removal, test execution
  - Bot-specific: handler order, service purity, temp file cleanup, DB connection, Docker build

- **Security Rules** → Read `security.md`
  - Mandatory when: handling user input, secrets, Telegram tokens, AI API keys, or group permissions

## Layer Rules

- Guardrails are the FINAL checkpoint, not the starting point
- If checklist.md says something is forbidden, it is forbidden — no exceptions
- Security rules take precedence over convenience and speed
- Bot development has additional checks: handler order, pure services, temp cleanup, DB connection
- After completing the checklist, the agent MUST follow the **Agent Hygiene Rule** in `checklist.md` and reset all checkboxes back to `[ ]`
- For bot tasks, verify `docker compose build` succeeds before declaring complete
