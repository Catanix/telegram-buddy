# Testing Plan Rail

## Scope

This project has **no automated test suite** (no Jest, no test files). Testing is manual via bot interaction. This rail documents the manual test plan.

## Manual Test Checklist

Before any release, verify these flows manually:

### Private Chat Auto-Download

| Platform | Test URL | Expected Result |
|----------|----------|-----------------|
| TikTok | Any valid TikTok URL | Video delivered within 30 seconds |
| Instagram (single photo) | Any public post | Photo delivered |
| Instagram (carousel) | Carousel with 2+ items | Media group (album) delivered, all items present |
| Instagram (reel) | Any reel URL | Video delivered |
| YouTube (video) | Any valid video URL | Video delivered, no quality selection |
| YouTube (shorts) | Any Shorts URL | Video delivered, MP4 format |
| X (text only) | Any tweet URL | Text summary delivered |
| X (with media) | Tweet with photos/video | Text + media delivered |

### Error Cases

| Case | Expected Result |
|------|-----------------|
| Invalid URL | No response (silently ignored) or "❌ Не удалось" |
| Private Instagram | "❌ Не удалось загрузить" |
| Deleted YouTube video | Error message, no crash |
| URL in group (no `/unzip`) | Ignored (auto-download disabled in groups) |

### Group Commands

| Command | Pre-condition | Expected Result |
|---------|---------------|-----------------|
| `/unzip` | Group approved, reply to URL message | Video/photo delivered as reply |
| `/summary` | Group approved, 5+ messages in history | AI summary delivered |
| `/unzip` in unapproved group | Bot not approved | No response or "awaiting approval" |

### Admin Flows

| Flow | Expected Result |
|------|-----------------|
| Add bot to new group | Admin receives notification with approve/deny buttons |
| Click ✅ Approve | Group gets confirmation message, commands work |
| Click ❌ Deny | Group stays blocked, bot doesn't respond |

### Stats

| Command | Expected Result |
|---------|-----------------|
| `/stats` | Shows download counts per platform |
| After download | Stats increment correctly |

## Regression Tests

After any change to download services, verify:
1. All 4 platforms still work (TikTok, Instagram, YouTube, X)
2. Carousel downloads still get all items
3. Temp files cleaned up (check `tmp/` directory)
4. Database stats increment correctly
5. Docker build succeeds

## Testing in Docker

```bash
# Rebuild and test
docker compose down
docker compose up --build -d
docker logs telegram-buddy -f

# Verify services work
docker exec telegram-buddy node -e "import('./src/services/media/youtube.js').then(m => console.log('YT OK'))"
docker exec telegram-buddy node -e "import('./src/services/media/instagram.js').then(m => console.log('IG OK'))"
```

## When to Test

| Change | What to test |
|--------|-------------|
| Download service changed | All platforms manual test |
| Handler order changed | All commands and auto-download |
| Database schema changed | Stats, group permissions, message history |
| Dockerfile changed | Docker build, bot starts, all platforms |
| New dependency added | Docker build, basic functionality |
