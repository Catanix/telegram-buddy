# E2E Testing Rail

## Scope
- End-to-end tests verify complete bot flows through the full stack
- They exercise real Telegram message handling, database operations, and downloaders
- They do NOT replace unit tests; they complement them
- E2E tests run against a real (or Dockerized) bot instance

## Test Environment
- Use a dedicated Telegram test bot (separate token from production)
- Run bot in Docker container with test database
- Use a private test group and private chat for testing
- Clean up messages and files after each test

## Test Data & Environment
- Use dedicated test accounts and sandboxed chats
- Seed data explicitly before each test; never rely on leftover state
- Clean up created files in `tmp/` after tests complete

## Selectors & Stability
- Tests interact via Telegram Bot API (not DOM selectors)
- Use message content matching to verify bot responses
- Send message → wait for response → assert on response text/content

## Isolation
- Each test MUST be independent: setup, execute, teardown
- Parallel execution is NOT recommended (single bot instance)
- Never hardcode waits; poll for message responses or use timeouts

## Boundaries
- E2E tests should not test edge cases exhaustively — unit tests handle that
- Focus on critical user paths: auto-download, /unzip, /summary, group access
- Do not test Playwright internals or yt-dlp behavior — those are unit test concerns

## Required E2E Flows

### 1. Private Chat Auto-Download (YouTube Shorts)
1. Send YouTube Shorts URL to bot in private chat
2. Wait for "⏳ Скачиваю..." message
3. Wait for video delivery
4. Assert: video file received, correct MIME type

### 2. Private Chat Auto-Download (Instagram Carousel)
1. Send Instagram carousel URL to bot in private chat
2. Wait for loading message
3. Wait for media group delivery
4. Assert: all carousel items received (photos/videos)

### 3. Group /unzip Command
1. Add bot to approved group
2. Send message with TikTok URL
3. Reply `/unzip` to that message
4. Assert: video delivered as reply to original message

### 4. Group /summary Command
1. Send 5+ messages in approved group
2. Send `/summary`
3. Assert: bot responds with AI-generated summary

### 5. Group Access Request
1. Add bot to new group
2. Assert: admin receives notification with approve/deny buttons
3. Click "approve"
4. Assert: bot responds in group with confirmation

## Docker E2E Setup
```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Run E2E tests
npm run test:e2e

# Teardown
docker compose -f docker-compose.test.yml down -v
```

## Test Database
- Use separate SQLite file for tests (e.g., `data/test.sqlite`)
- Initialize with same schema as production
- Reset before each test suite
