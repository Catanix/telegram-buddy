# Data Models & Boundaries

This file defines the hard constraints and validation rules for all data structures.

## Global Rules
- Every field MUST have a defined type, maximum length, and nullability
- Numeric fields MUST specify precision, scale, and valid ranges
- String fields MUST specify max length and allowed character sets
- Dates MUST include timezone rules or be explicitly UTC

## Database Schema

### user_stats
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| user_id | INTEGER | NO | — | PRIMARY KEY, Telegram user ID |
| username | TEXT | YES | — | Telegram username (cached) |
| downloads | INTEGER | NO | 0 | Total downloads (legacy) |
| downloads_tiktok | INTEGER | NO | 0 | TikTok download count |
| downloads_instagram | INTEGER | NO | 0 | Instagram download count |
| downloads_youtube | INTEGER | NO | 0 | YouTube download count |
| downloads_x | INTEGER | NO | 0 | X/Twitter download count |
| last_active | DATETIME | NO | CURRENT_TIMESTAMP | Auto-updated on activity |

### group_permissions
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | NO | — | PRIMARY KEY, AUTOINCREMENT |
| group_id | TEXT | NO | — | UNIQUE, Telegram group ID |
| group_name | TEXT | YES | — | Group title (cached) |
| allowed | BOOLEAN | NO | 0 | 0=pending, 1=approved |
| requested_by | TEXT | YES | — | Username who added bot |
| requested_at | DATETIME | NO | CURRENT_TIMESTAMP | When request was made |
| allowed_at | DATETIME | YES | — | When approved (null if pending) |

### group_messages
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | NO | — | PRIMARY KEY, AUTOINCREMENT |
| group_id | TEXT | NO | — | Telegram group ID |
| message_id | INTEGER | NO | — | Telegram message ID |
| user_id | INTEGER | NO | — | Telegram user ID |
| username | TEXT | YES | — | Telegram username |
| first_name | TEXT | YES | — | Display name |
| text | TEXT | YES | — | Message content |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | When message was stored |

**Constraints:**
- UNIQUE(group_id, message_id) — prevents duplicate storage
- Max 100 messages per group (auto-cleanup on insert)
- Auto-delete messages older than 7 days (cron or manual cleanup)

## Validation Rules
- Validation MUST happen at the system boundary (Telegram message handler) before processing
- URL extraction MUST reject non-supported platforms before download attempt
- Group ID MUST be cast to STRING before DB operations (SQLite type affinity)
- User ID MUST be validated as positive integer before stats increment
- Failed validations MUST return explicit, actionable error messages to user

## Media Download Constraints
| Platform | Max Duration | Max File Size | Notes |
|----------|-------------|---------------|-------|
| TikTok | — | 50MB | Direct video download |
| Instagram | — | 50MB per item | Carousel: up to 10 items per media group |
| YouTube | — | 50MB | Best combined format ≤720p, no quality selection |
| X | — | 5MB | Text + optional media attachments |

## Telegram API Limits
| Constraint | Value | Notes |
|------------|-------|-------|
| Media group size | 10 items max | Split large carousels |
| Video file size | 50MB | Telegram Bot API limit |
| Photo file size | 10MB | Telegram Bot API limit |
| Message length | 4096 chars | Truncate summaries if needed |
| Caption length | 1024 chars | For media with captions |

## Environment Variables
| Variable | Required | Format | Notes |
|----------|----------|--------|-------|
| TELEGRAM_TOKEN | YES | `bot123:ABC...` | Bot token from @BotFather |
| AUTHORIZED_USERNAME | YES | `username` | Admin username (no @) |
| ADMIN_CHAT_ID | YES | `123456789` | Telegram chat ID for notifications |
| LM_PROVIDER | NO | `Deepseek` | AI provider for summarization |
| LM_API_KEY | YES (if LM_PROVIDER set) | `sk-...` | API key for AI provider |
