# State Management Rail

## Core Principles
- Bot is stateless: no in-memory state between requests
- All persistent state lives in SQLite database
- Each request is independent: same input → same output
- No sessions, no conversation context storage

## Global State (Database)

Use `database/index.js` for all persistent state:

| State | Table | Purpose |
|-------|-------|---------|
| Group permissions | `group_permissions` | Track approved/pending groups |
| Message history | `group_messages` | Store last 100 messages per group for summarization |
| Usage stats | `user_stats` | Track downloads per platform per user |

## Local State (Per Request)

Keep request-scoped state minimal:
- `loadingMsg` — Message ID of temporary "⏳ Скачиваю..." message
- Temp file paths — UUID-based filenames in `tmp/` directory
- These are destroyed after request completes (success or error)

## State Patterns

### ✅ Good: Stateless Services
```javascript
// Service returns data, doesn't store state
const result = await downloadYouTubeMedia(url);
// result: {filePath, mediaType} — caller decides what to do
```

### ✅ Good: Database as Single Source of Truth
```javascript
// Group access check — always query DB
const isAllowed = await groupPermissions.isGroupAllowed(groupId);
// Never cache this in memory — always fresh from DB
```

### ❌ Forbidden: Global State
```javascript
// NEVER: global variable that leaks between requests
let currentDownloads = []; // ❌ state leaks across users

// NEVER: closure state in handler
bot.on('text', (ctx) => {
    const userState = {}; // ❌ not shared, but not needed either
});
```

### ❌ Forbidden: In-Memory Caching
```javascript
// NEVER: cache group permissions in memory
const groupCache = new Map(); // ❌ stale on multi-instance deploy
// Always query SQLite: groupPermissions.isGroupAllowed(groupId)
```

## File System State

- `tmp/` directory: temporary download files
- Files are created with UUID names to prevent collisions
- Files MUST be deleted after delivery (success or error)
- `tmp/` is gitignored and Docker volume (if needed)

## Environment State

- Environment variables loaded once at startup via `dotenv`
- `CONFIG` object in `src/config/index.js` is read-only after init
- No runtime changes to env vars — restart bot to apply changes

## Forbidden Patterns
- Storing user sessions or conversation state in memory
- Caching DB query results in global variables
- Using `setTimeout`/`setInterval` for persistent background tasks (use cron instead)
- Sharing mutable state between handler invocations
