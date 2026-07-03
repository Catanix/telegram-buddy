# Core Business Flows

This file maps multi-step transactional processes. Implementations MUST match these sequences.

## How to use this file
- Before implementing a flow, read its definition here
- Do not skip steps, reorder them, or add undocumented side effects
- If a flow needs to change, update this file first

## Flow: Private Chat Auto-Download
**Trigger:** User sends a message containing a supported URL in a private chat
**Actors:** User, Bot, Media Service (TikTok/Instagram/YouTube/X), Telegram API

1. **Step 1: URL Detection**
   - Pre-condition: Message is in private chat, user is admin
   - Action: `extractMediaUrls()` scans text for supported patterns
   - Post-condition: `{url, type}` identified or flow ends silently

2. **Step 2: Download Initiation**
   - Pre-condition: Valid media URL detected
   - Action: Bot sends "⏳ Скачиваю..." loading message
   - Side effects: none

3. **Step 3: Media Fetch**
   - Pre-condition: Loading message sent
   - Action: Dispatch to type-specific downloader:
     - TikTok → `downloadTikTokMedia()` → `{filePath, mediaType}`
     - Instagram → `downloadInstagramMedia()` → `{files: [...]}` (carousel support)
     - YouTube → `downloadYouTubeMedia()` → `{filePath, mediaType}`
     - X → `downloadXMedia()` → text + optional media files
   - Post-condition: Media files exist in `tmp/` or error

4. **Step 4: Delivery**
   - Pre-condition: Media files downloaded successfully
   - Action: Delete loading message, send media via Telegram API
     - Single file → `replyWithVideo()` / `replyWithPhoto()`
     - Carousel → `replyWithMediaGroup()` (max 10 items per group)
   - Post-condition: User receives media

5. **Step 5: Cleanup & Stats**
   - Pre-condition: Media delivered successfully
   - Action: `fs.unlinkSync()` temp files, `incrementStats()` for usage tracking
   - Post-condition: Disk clean, stats updated

**Rollback:** If any step fails after loading message, edit it to show error text
**Idempotency:** Safe to retry — temp files use UUIDs, no duplicate delivery risk

## Flow: Group /unzip Command
**Trigger:** User replies `/unzip` to a message containing a URL in an approved group
**Actors:** Group Member, Bot, Media Service, Telegram API

1. **Step 1: Permission Check**
   - Pre-condition: Group is in `group_permissions` with `allowed=1`
   - Action: Middleware allows command execution
   - Post-condition: Handler proceeds

2. **Step 2: URL Extraction**
   - Pre-condition: Command is triggered
   - Action: Extract URL from replied message or command args
   - Post-condition: `{url, type}` identified

3. **Step 3: Download & Deliver**
   - Same as Private Chat Flow Steps 3-4, but:
     - Reply references original message (`reply_to_message_id`)
     - Works in group context

4. **Step 4: Cleanup**
   - Same as Private Chat Step 5

**Rollback:** Reply with error message if download fails
**Idempotency:** Not idempotent — each /unzip creates a new response message

## Flow: Group /summary Command
**Trigger:** User sends `/summary` in an approved group
**Actors:** Group Member, Bot, DeepSeek API, Telegram API

1. **Step 1: Fetch History**
   - Pre-condition: Group has stored messages in `group_messages`
   - Action: `getRecentMessages(groupId, 100)` returns last 100 messages
   - Post-condition: Message array ready for summarization

2. **Step 2: Format Context**
   - Pre-condition: Messages fetched
   - Action: Format messages as "username: text" list for DeepSeek
   - Post-condition: Prompt string ready

3. **Step 3: AI Summarization**
   - Pre-condition: Formatted prompt ready
   - Action: `summarizeMessages()` calls DeepSeek API with system prompt
   - Post-condition: Summary text returned or error

4. **Step 4: Delivery**
   - Pre-condition: Summary received
   - Action: Send summary as reply in group
   - Post-condition: Group members see summary

**Rollback:** Reply with error if DeepSeek fails or no messages exist
**Idempotency:** Safe to retry — each /summary generates a fresh summary

## Flow: Group Access Request
**Trigger:** Bot is added to a new group
**Actors:** Group Admin, Bot, Admin User (authorized username)

1. **Step 1: Auto-Request**
   - Pre-condition: Bot detects `my_chat_member` update with new group
   - Action: `requestGroupAccess()` stores group in `group_permissions` with `allowed=0`
   - Side effect: Send notification to admin chat with approve/deny buttons

2. **Step 2: Admin Decision**
   - Pre-condition: Admin receives notification
   - Action: Admin clicks ✅ (allow) or ❌ (deny)
   - Post-condition: `group_permissions.allowed` updated

3. **Step 3: Notification**
   - Pre-condition: Decision recorded
   - Action: Bot sends confirmation to group ("approved" or "awaiting approval")
   - Post-condition: Group knows its status

**Rollback:** Deny button sets `allowed=0`, group stays blocked
**Idempotency:** Requesting access twice is idempotent (ON CONFLICT UPDATE)
