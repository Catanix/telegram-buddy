# Glossary: Ubiquitous Language

This file defines the canonical vocabulary of the product. Every name in the codebase MUST come from this list.

## How to use this file
- When naming anything (variable, function, table, endpoint), find the concept here first
- If the concept does not exist, add it here BEFORE using it in code
- Never use synonyms, abbreviations, or alternative spellings for defined terms

## RAILGUN System Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Rail** | A single focused `.md` file containing rules for one concern | "rule file", "doc", "guide" |
| **Layer** | A numbered directory (`00`–`04`) grouping related rails | "folder", "category", "section" |
| **Dispatcher** | The `AGENTS.md` inside a layer that tells AI which rails to load | "index", "router", "map" |
| **Preset** | Pre-configured set of rails for a specific tech stack (React, Vue, Python, Go) | "template", "boilerplate", "starter" |

## Bot System Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Handler** | A function that processes a Telegram update (message, command, callback) | "controller", "processor", "action" |
| **Middleware** | Function that intercepts updates before they reach handlers (access control, logging) | "filter", "interceptor", "guard" |
| **Command** | A bot command triggered by `/name` (e.g., `/unzip`, `/summary`) | "action", "operation", "endpoint" |
| **Flow** | A multi-step business process (auto-download, group request, summarization) | "process", "workflow", "pipeline" |
| **Service** | A module that encapsulates external API interaction or complex logic | "helper", "utility", "lib" |
| **Extractor** | Function that parses URLs from text and identifies the platform | "parser", "scanner", "detector" |
| **Downloader** | Function that fetches media from a URL and saves it locally | "fetcher", "loader", "getter" |
| **Carousel** | An Instagram post with multiple media items (photos/videos) | "album", "gallery", "multi-post" |
| **Unzip** | The `/unzip` command that extracts media from a link in a group | "extract", "download", "rip" |
| **Summary** | The `/summary` command that generates an AI summary of group chat history | "summarize", "digest", "recap" |

## Platform Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Platform** | A social media service the bot can download from (TikTok, Instagram, YouTube, X) | "source", "site", "provider" |
| **Shortcode** | The unique identifier in an Instagram URL (e.g., `DaSNF6viMdF`) | "id", "code", "post-id" |
| **Embed** | Instagram's embed page (`/p/{shortcode}/embed/`) used for scraping | "preview", "widget", "frame" |
| **Media Group** | Telegram API feature for sending multiple photos/videos as an album | "album", "batch", "collection" |
| **Loading Message** | Temporary "⏳ Скачиваю..." message shown during download | "spinner", "progress", "wait-msg" |

## Data Terms

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Group Permission** | Record in `group_permissions` tracking whether a group is approved | "access", "authorization", "approval" |
| **Message History** | Stored messages in `group_messages` for summarization context | "log", "archive", "history" |
| **Usage Stats** | Counters in `user_stats` tracking downloads per platform | "metrics", "analytics", "counters" |
| **Temp File** | File in `tmp/` directory with UUID name, deleted after delivery | "cache", "buffer", "staging" |

## Actions / Operations

| Canonical Term | Definition | Forbidden Alternatives |
|----------------|------------|------------------------|
| **Scrape** | Use Playwright to extract media URLs from Instagram embed page | "parse", "crawl", "fetch" |
| **Dispatch** | Route a download request to the correct platform-specific downloader | "route", "delegate", "send" |
| **Deliver** | Send downloaded media to the user via Telegram API | "send", "upload", "post" |
| **Cleanup** | Delete temporary files after successful delivery | "purge", "clear", "remove" |
| **Request Access** | Send group approval request to admin when bot is added to new group | "ask", "notify", "ping" |

## Value Objects / Types

| Canonical Term | Definition | Examples |
|----------------|------------|----------|
| **Media Result** | Object returned by downloader: `{filePath, mediaType}` or `{files: [...]}` | `{filePath: "tmp/abc.mp4", mediaType: "video"}` |
| **Media Type** | Classification of media: `video`, `photo`, `audio` | Used in Telegram API calls |
| **Chat Type** | Telegram chat context: `private`, `group`, `supergroup` | Determines available commands |
| **Callback Data** | Data payload in inline keyboard buttons (`allow_group_123`) | Used for admin approve/deny |
