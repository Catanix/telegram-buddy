# Telegram Buddy - Project Documentation

## Overview
Telegram бот для извлечения контента из социальных сетей и AI-саммаризации обсуждений в группах.

## Features

### Private Chat
- Auto-download media from social links (TikTok, Instagram, YouTube, X)
- Music search: `/music <query>`
- Stats: `/stats`

### Groups (Admin Approval Required)
- `/unzip` - Extract content from links (reply to message or use after link)
- `/summary` - AI summarization of last 100 messages via DeepSeek
- Admin approval via buttons in private chat when bot added to group

## Architecture

### Key Files
- `src/bot/handlers/commands/groupCommands.js` - `/unzip`, `/summary` handlers
- `src/bot/handlers/textHandler.js` - Auto-extract for private chats only
- `src/bot/middleware/checkAccess.js` - Access control logic
- `src/services/api/summarize.js` - DeepSeek integration
- `src/models/GroupPermissionsModel.js` - Group access management

### Database Schema
- `group_permissions` - Group access control (group_id, allowed, requested_by)
- `group_messages` - Message history per group (up to 100 messages, auto-cleanup)
- `user_stats` - Usage statistics

## Deployment

### Docker (Recommended)
```bash
cd ~/telegram-buddy
docker compose up -d --build
```

### Restart
```bash
docker compose restart
```

### Logs
```bash
docker logs telegram-buddy -f
```

## Environment Variables
```
TELEGRAM_TOKEN=your_bot_token
AUTHORIZED_USERNAME=your_username
ADMIN_CHAT_ID=your_chat_id_for_notifications
LM_PROVIDER=Deepseek
LM_API_KEY=your_deepseek_key
```

## Commands
| Command | Description | Where |
|---------|-------------|-------|
| `/start` | Bot info | Everywhere |
| `/music` | Music search | Private |
| `/stats` | Usage stats | Private |
| `/unzip` | Extract content | Groups (approved) |
| `/summary` | AI summary | Groups (approved) |

## Supported Platforms
- TikTok
- Instagram (posts/reels)
- YouTube
- X (Twitter)

## Notes
- Each group has isolated message history (max 100 messages)
- Messages auto-cleanup after 7 days
- Bot requires admin rights in groups for proper functionality
