# Bot Routing & Navigation Rail

## Core Principles
- Handlers are registered in strict order: middleware first, specific commands next, catch-all text last
- Every handler that doesn't match MUST call `next()` to continue the chain
- Access control happens before any business logic, never after
- Commands are declarative and centralized in `bot.js`

## Handler Chain Structure

```
Message Logger (always first)
    ↓
Access Control Middleware
    ↓
Command Handlers (/start, /stats, /music, /unzip, /summary)
    ↓
Action Handlers (inline button callbacks)
    ↓
Text Handler (auto-download, last in chain)
```

## Handler Registration Rules

1. **Middleware before commands** — access control, logging, message saving
2. **Specific commands before generic** — `/unzip` before text handler
3. **Text handler LAST** — catches any remaining text messages
4. **Never skip `next()`** — if a handler doesn't match, pass control down

## Command Routing

| Command | Where | Handler | Access Control |
|---------|-------|---------|---------------|
| `/start` | Everywhere | `bot.command('start')` | None |
| `/stats` | Private only | `statsHandler` | Admin check (private) |
| `/music` | Private only | `musicSearchHandler` | Admin check (private) |
| `/unzip` | Groups only | `unzipHandler` | Group approved + admin |
| `/summary` | Groups only | `summaryHandler` | Group approved + admin |

## Private Chat Flow
- Only admin (AUTHORIZED_USERNAME) can use bot
- Auto-download from supported URLs
- No commands except `/start`, `/stats`, `/music`

## Group Flow
- Bot must be approved before responding
- `/unzip` and `/summary` only
- All messages saved to `group_messages` for summarization
- Group access requested via inline buttons when bot is added

## Guards & Access Control
- **Private chat:** Check `ctx.from.username === CONFIG.adminUsername`
- **Group chat:** Check `groupPermissions.isGroupAllowed(String(chatId))`
- **Never rely on command hiding** — enforce at middleware level
- **Admin notifications:** Send approval requests to `CONFIG.adminChatId`

## Callback Actions
- `allow_group_${groupId}` — Approve group access
- `deny_group_${groupId}` — Deny group access
- Callbacks MUST parse `callback_data`, extract action and target

## Forbidden Patterns
- Registering text handler before commands (commands won't fire)
- Missing `next()` in middleware that doesn't match
- Access control in individual handlers instead of middleware
- Hardcoded command names in multiple places (use `commandList.js`)
