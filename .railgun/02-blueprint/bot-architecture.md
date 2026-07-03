# Bot Architecture Rail

## Core Principles
- Handlers are single-purpose: each handles ONE type of update
- Services are isolated: no Telegram context in download functions
- Error boundaries: every handler has try/catch, never crashes the bot
- Stateless by design: bot scales horizontally, no in-memory session state

## Project Structure

```
src/
├── bot/
│   ├── bot.js              # Bot factory, middleware chain, command registration
│   ├── index.js            # Entry point, imports bot
│   ├── setup.js            # Additional bot configuration (webhooks, etc.)
│   ├── handlers/
│   │   ├── textHandler.js      # Auto-download for private chats
│   │   ├── commands/
│   │   │   ├── groupCommands.js    # /unzip, /summary
│   │   │   ├── musicSearchHandler.js
│   │   │   ├── statsHandler.js
│   │   │   └── index.js
│   │   └── actions/
│   │       ├── groupPermissionActions.js  # Approve/deny buttons
│   │       └── init.js
│   └── middleware/
│       ├── checkAccess.js      # Private chat admin check
│       └── middleware.js       # Additional middleware
├── services/
│   ├── media/
│   │   ├── instagram.js      # Playwright embed scraper
│   │   ├── tiktok.js         # Direct video download
│   │   ├── youtube.js        # yt-dlp wrapper
│   │   ├── x.js              # Twitter/X scraper
│   │   └── music.js          # Music search
│   ├── api/
│   │   ├── lm_api.js         # LLM provider abstraction
│   │   └── summarize.js      # DeepSeek summarization
│   ├── database/
│   │   ├── index.js          # DB connection, table creation
│   │   └── messages.js       # Message CRUD operations
│   ├── db.js                 # Stats wrapper (uses database/index.js)
│   └── groupPermissions.js   # Group access logic
├── models/
│   └── GroupPermissionsModel.js
├── utils/
│   ├── extractUrl.js         # URL detection and platform classification
│   ├── commandList.js        # Command registration helper
│   ├── dateUtils.js
│   └── logger.js
└── config/
    └── index.js              # Environment variables, constants
```

## Handler Order (Critical)

Telegraf middleware executes in registration order. The chain is:

1. **Message Logger** — Log all incoming messages (first, before everything)
2. **Access Control** — Check private chat admin / group permissions
3. **Command Handlers** — /start, /stats, /music, /unzip, /summary
4. **Group Actions** — Inline button callbacks (approve/deny)
5. **Text Handler** — Auto-download for private chats (last, catches all text)

**Rule:** If a handler doesn't match, it MUST call `next()` so lower handlers can process.

## Dependencies
- `telegraf` — Telegram Bot API framework
- `playwright` — Headless browser for Instagram scraping
- `sqlite` + `sqlite3` — Database
- `node-fetch` — HTTP requests
- `openai` — DeepSeek API client
- `yt-dlp` (binary) — YouTube downloading

## Error Handling
- Every handler wraps in try/catch
- Failed downloads show user-friendly error ("❌ Не удалось загрузить")
- `bot.catch()` logs all unhandled errors
- Never throw uncaught exceptions — crashes the bot process

## Service Isolation

Download functions MUST be pure:
```javascript
// ✅ Good: returns file paths, no Telegram context
const result = await downloadYouTubeMedia(url); // {filePath, mediaType}

// ❌ Bad: passing ctx into service
await downloadYouTubeMedia(ctx, url); // service should not know about Telegram
```

This enables:
- Unit testing without mocking Telegram
- Reusing downloaders in other contexts (CLI, API, etc.)
- Easier debugging — test download function in isolation

## Forbidden Patterns
- Passing `ctx` (Telegram context) into service functions
- Storing state in global variables or closures between requests
- Synchronous filesystem operations (always async/await)
- Direct database access from handlers (use service layer)
- Hardcoded paths (always use `path.resolve()` or `path.join()`)
