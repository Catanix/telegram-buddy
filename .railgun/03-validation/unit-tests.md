# Unit Testing Rail

## Structure: AAA Pattern
Every test MUST follow Arrange → Act → Assert:
1. **Arrange:** Set up mocks, fixtures, and initial state
2. **Act:** Execute the single unit of behavior being tested
3. **Assert:** Verify exactly one outcome per test case

## Mocking Rules
- Mock all external dependencies: Telegram API, Playwright, yt-dlp, network, filesystem, database
- Never make real network requests or launch real browsers in unit tests
- Mocks MUST be reset between tests to prevent state leakage
- Prefer explicit mock setup over global auto-mocks

## Assertions
- One logical assertion per test; if you need more, split the test
- Assert on outcomes (results, state changes), not implementation details (internal call counts)
- Error cases MUST be tested explicitly, not just the happy path

## Test Data
- Use factory functions for complex objects, not copy-pasted literals
- Never use production data, PII, or real Telegram tokens in tests
- Keep test data co-located with the test or in a dedicated `__fixtures__` directory

## Forbidden Patterns
- Tests that depend on execution order of other tests
- Tests with non-deterministic inputs (random, Date.now(), network) without mocking
- Tests that assert on internal implementation rather than public behavior

## Bot-Specific Testing

### Mocking Telegram (Telegraf)
```javascript
import { Context } from 'telegraf';

// Create mock context
const createMockCtx = (overrides = {}) => ({
  message: { text: 'https://example.com', message_id: 1 },
  chat: { id: 123, type: 'private' },
  from: { id: 456, username: 'testuser' },
  reply: jest.fn(),
  replyWithVideo: jest.fn(),
  replyWithPhoto: jest.fn(),
  deleteMessage: jest.fn(),
  telegram: { editMessageText: jest.fn() },
  ...overrides
});
```

### Mocking Download Services
```javascript
// Mock YouTube downloader
jest.mock('../../services/media/youtube.js', () => ({
  downloadYouTubeMedia: jest.fn()
}));

// In test:
import { downloadYouTubeMedia } from '../../services/media/youtube.js';
downloadYouTubeMedia.mockResolvedValue({
  filePath: 'tmp/test.mp4',
  mediaType: 'video'
});
```

### Mocking Playwright
```javascript
// Mock Playwright for Instagram tests
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(() => Promise.resolve({
      newContext: jest.fn(() => Promise.resolve({
        newPage: jest.fn(() => Promise.resolve({
          goto: jest.fn(),
          evaluate: jest.fn(() => Promise.resolve([{ type: 'photo', url: 'http://example.com/img.jpg' }])),
          waitForTimeout: jest.fn(),
          close: jest.fn()
        }))
      })),
      close: jest.fn()
    }))
  }
}));
```

### Mocking Database
```javascript
// Mock database for stats tests
jest.mock('../../services/database/index.js', () => ({
  getDatabase: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  })),
  initDatabase: jest.fn()
}));
```

### Filesystem Testing
- Use `fs.mkdtemp()` for temp directories in tests
- Always clean up temp files in `afterEach`
- Assert on file existence AND content

### Test Isolation
- Reset mocks with `jest.resetAllMocks()` in `beforeEach`
- Never share temp directories between tests
- Each test gets fresh filesystem and mock state

### Required Test Cases by Module

**URL Extractor (`extractUrl.js`):**
1. Detects TikTok URLs
2. Detects Instagram URLs (posts, reels, with/without params)
3. Detects YouTube URLs (videos, shorts)
4. Detects X/Twitter URLs
5. Returns null for unsupported URLs
6. Handles URLs with query params and fragments

**Download Services:**
1. **Happy path:** Returns valid file path and media type
2. **Invalid URL:** Returns null or throws with clear error
3. **Network failure:** Handles timeout/connection errors gracefully
4. **File cleanup:** Temp files deleted after success/failure

**Group Permissions:**
1. New group: creates pending request
2. Approved group: returns true
3. Denied group: returns false
4. Duplicate request: updates existing record (idempotent)

**Access Control Middleware:**
1. Admin in private chat: allowed
2. Non-admin in private chat: denied
3. Approved group: allowed
4. Unapproved group: requests access
