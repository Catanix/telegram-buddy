# Current Sprint / Active Context

## Active Tasks
- Bot Maintenance & Feature Fixes
  - YouTube Shorts download (via yt-dlp, no quality selection)
  - Instagram carousel/reels (via Playwright embed scraping, no cookies)
  - Clean isolated download functions for testability
- Docker deployment optimization (Playwright + Chromium deps)

## Modules in Refactoring
- `src/services/media/instagram.js` — Playwright-based embed scraper
- `src/services/media/youtube.js` — yt-dlp-based downloader
- `src/services/db.js` — Fixed to use `database/index.js` connection
- `src/bot/handlers/textHandler.js` — Unified media handling for all platforms
- `src/bot/handlers/commands/groupCommands.js` — Carousel support in groups
- `Dockerfile` — Added Playwright system deps + Chromium install

## Code Freezes / Moratoriums
- No new social platforms until current 4 are stable
- No quality selection UI for YouTube (download original only)

## Known Blockers
- (none)

## Temporary Workarounds
- None currently

## Completed This Sprint
- ✅ YouTube Shorts fixed (yt-dlp replaces ytdl-core)
- ✅ Instagram carousel fixed (Playwright embed scraping, no cookies needed)
- ✅ Clean download functions (no Telegram context, testable in isolation)
- ✅ Database stats fixed (`db.js` uses `database/index.js` connection)
- ✅ Docker image rebuilt with Playwright deps
- ✅ RAILGUN methodology integrated
