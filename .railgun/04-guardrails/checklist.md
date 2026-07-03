# Pre-Commit Checklist Rail

## Mandatory Self-Review (perform before every commit)

- [ ] I have read the relevant rails for this task and followed them
- [ ] No `console.log`, `debugger`, or temporary comments remain in the code
- [ ] No dead code, unused imports, or commented-out blocks
- [ ] All new code has corresponding tests (unit or integration as appropriate)
- [ ] All tests pass locally
- [ ] No secrets, passwords, API keys, or tokens are hardcoded
- [ ] No PII (personally identifiable information) is exposed in logs or errors
- [ ] Error handling covers edge cases, not just the happy path
- [ ] Variable and function names follow the project glossary and conventions

## CLI-Specific Checks (for RAILGUN CLI development)

- [ ] Commands registered in `src/index.ts` with proper descriptions
- [ ] No hardcoded paths (always use `process.cwd()` or `path.join()`)
- [ ] Existing AI configs detected before modification (CLAUDE.md, .cursorrules, AGENTS.md)
- [ ] User confirmation obtained before modifying any project files
- [ ] Graceful exit when user declines (exit code 0, no error message)
- [ ] ASCII art renders correctly in terminal (test with `node dist/index.js`)
- [ ] Pink color scheme consistent (`#FF69B4` primary, green success, yellow warning)
- [ ] All preset files are valid markdown (React, Vue, Python, Go)
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm test` passes with 100% of tests green
- [ ] No `node_modules/` or `dist/` committed (check `.gitignore`)

## Commit Message Format (Conventional Commits)

Every commit message MUST follow this structure:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Rules
- **type** is mandatory: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **scope** is optional but recommended (module or component name)
- **subject** is mandatory: lowercase, imperative mood, no period at the end (max 50 chars)
- **body** is optional: explains WHAT and WHY, not HOW (wrap at 72 chars)
- **footer** is optional: references issues, breaking changes (`BREAKING CHANGE:`)

### Examples
```
feat(auth): add password reset flow

Implement token-based password reset with 24h expiration.
Emails are sent via the notification service.

Closes #142
```

```
fix(api): handle null response in user endpoint

Prevent 500 error when downstream service returns empty payload.

Fixes #289
```

### Forbidden
- Vague subjects: "fix bug", "update", "wip"
- Past tense: "added", "fixed", "changed"
- Missing type or subject

## Completion Confirmation

Before declaring this task complete, I confirm that:
- [ ] I have read all relevant rails for this task
- [ ] I have completed the Mandatory Self-Review checklist above
- [ ] I have completed the CLI-Specific Checks (if applicable)
- [ ] I have verified the commit message format (if committing)
- [ ] I have run all applicable tests and they pass
- [ ] I have explicitly stated which rails were used in this task

## Agent Hygiene Rule

After confirming the Completion Confirmation above and declaring the task complete, you MUST reset ALL checkboxes in this file back to `[ ]` (unchecked). Do not leave checked boxes for the next agent.

This checklist must always start clean for every new task.