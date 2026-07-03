# Security Rail

## Secrets & Credentials
- NEVER hardcode API keys, passwords, tokens, or database connection strings in source code
- All secrets MUST be injected via environment variables (`.env` file)
- Never commit `.env` files or local configuration containing real credentials
- Rotate exposed secrets immediately if accidental commit occurs

## Telegram Bot Token
- `TELEGRAM_TOKEN` is the most sensitive secret — treat it like a password
- Never log the token, even in debug mode
- If token is exposed, regenerate it via @BotFather immediately
- Token grants full control over the bot — do not share it

## AI API Keys
- `LM_API_KEY` (DeepSeek) MUST be stored in environment variables only
- Never log AI API responses that may contain user message content
- Monitor API usage for unexpected spikes (potential abuse)

## User Input
- Treat all Telegram messages as untrusted
- Validate URLs before passing to downloaders (check supported platforms)
- Sanitize message text before storing in database (`group_messages`)
- Use parameterized queries; never concatenate user input into SQL
- Never execute user-provided URLs as shell commands (use `execFileSync` with explicit args, not `exec` with string interpolation)

## Authentication & Authorization
- Admin check: `ctx.from.username === CONFIG.authorizedUsername` — case-sensitive
- Group approval: `group_permissions.allowed === 1` — never trust client-side
- Group ID MUST be cast to STRING before DB operations to prevent type confusion
- Never allow group commands in private chats (enforced by middleware, not just UI)

## Logging & Errors
- NEVER log sensitive data: Telegram tokens, API keys, user passwords
- Error messages sent to users MUST be generic ("❌ Не удалось загрузить")
- Log detailed errors server-side only with `[ModuleName]` prefix
- Include correlation info: `ctx.chat.id`, `ctx.from.id`, message text (truncated)

## Media Download Security
- Validate URLs match expected patterns before downloading
- Use `URL` constructor to parse and validate URLs
- Limit download sizes (Telegram API: 50MB video, 10MB photo)
- Never forward downloaded files to unauthorized chats
- Clean up temp files after delivery to prevent disk exhaustion

## Playwright Security
- Run Playwright in headless mode only
- Do not expose browser to external network
- Close browser instances in `finally` blocks to prevent resource leaks
- Instagram embed scraping: no user credentials, no cookies, no login

## Dependencies
- Review new dependencies for known vulnerabilities before adding (`npm audit`)
- Pin dependency versions in `package.json`
- Keep dependencies updated; stale dependencies are a common attack vector
- yt-dlp binary: download from official source, verify checksum if possible

## Docker Security
- `.env` file is NOT copied into Docker image (check `.dockerignore`)
- Environment variables passed via `docker-compose.yml` or runtime flags
- Do not run bot as root in container if possible
- `tmp/` directory has correct permissions for file creation/deletion

## Group Chat Safety
- Bot MUST require explicit admin approval before responding in new groups
- Never automatically join or respond to all groups
- Message history stored for 7 days max — older messages auto-deleted
- Summary feature: AI processes only last 100 messages, no persistent storage of summaries
