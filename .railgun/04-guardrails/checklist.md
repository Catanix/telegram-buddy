# Pre-Commit Checklist Rail

## Mandatory Self-Review (perform before every commit)

- [ ] I have read the relevant rails for this task and followed them
- [ ] No `console.log`, `debugger`, or temporary comments remain in the code
- [ ] No dead code, unused imports, or commented-out blocks
- [ ] All new code has been manually tested (see `03-validation/testing-plan.md`)
- [ ] No secrets, passwords, API keys, or tokens are hardcoded
- [ ] No PII (personally identifiable information) is exposed in logs or errors
- [ ] Error handling covers edge cases, not just the happy path
- [ ] Variable and function names follow the project glossary and conventions

## Bot-Specific Checks

- [ ] Handlers registered in correct order (middleware → commands → actions → text)
- [ ] All handlers call `next()` when they don't match the current update
- [ ] Download functions are pure — no Telegram `ctx` passed into services
- [ ] Temp files in `tmp/` are cleaned up after success AND failure
- [ ] Database operations use `database/index.js` (not standalone `db.js` connection)
- [ ] Group ID cast to STRING before DB operations (`String(groupId)`)
- [ ] Environment variables checked at startup (`process.env.TELEGRAM_TOKEN` exists)
- [ ] Error messages shown to users are in Russian ("❌ Не удалось...")
- [ ] Logs to console use English with `[ModuleName]` prefix for grepability
- [ ] No blocking operations in handlers (all async with await)
- [ ] Playwright browser instances are closed in `finally` blocks
- [ ] yt-dlp binary exists in container (`yt-dlp` in Dockerfile, not just host)
- [ ] Docker image builds successfully (`docker compose build`)
- [ ] Bot starts without errors in Docker (`docker compose up` logs)

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
feat(youtube): add yt-dlp downloader for shorts and videos

Replace ytdl-core with yt-dlp binary. Downloads best combined
format without quality selection. Supports shorts via /shorts/ URLs.

Closes #42
```

```
fix(instagram): handle carousel posts via playwright embed

Playwright opens embed page, clicks through slides, collects all
media URLs. No cookies required. Falls back to error message if
embed fails.

Fixes #55
```

### Forbidden
- Vague subjects: "fix bug", "update", "wip"
- Past tense: "added", "fixed", "changed"
- Missing type or subject

## Completion Confirmation

Before declaring this task complete, I confirm that:
- [ ] I have read all relevant rails for this task
- [ ] I have completed the Mandatory Self-Review checklist above
- [ ] I have completed the Bot-Specific Checks
- [ ] I have verified the commit message format (if committing)
- [ ] I have manually tested the changes (see `03-validation/testing-plan.md`)
- [ ] I have explicitly stated which rails were used in this task

## Agent Hygiene Rule

After confirming the Completion Confirmation above and declaring the task complete, you MUST reset ALL checkboxes in this file back to `[ ]` (unchecked). Do not leave checked boxes for the next agent.

This checklist must always start clean for every new task.
