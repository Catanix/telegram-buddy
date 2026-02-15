# AGENTS.md - Telegram Buddy Bot

## О проекте

**Telegram Buddy** — личный бот-помощник для быстрых задач: голосовые напоминания, скачивание медиа (Instagram, TikTok, YouTube, X/Twitter), поиск музыки.

## Технологии

- **Node.js 20+** (ES модули)
- **Telegraf** — Telegram Bot API
- **SQLite** — хранение задач
- **@xenova/transformers** — офлайн распознавание речи (Whisper)
- **OpenAI/DeepSeek API** — AI обработка текста

## Структура проекта

```
src/
├── bot/
│   ├── handlers/
│   │   ├── commands/
│   │   │   ├── musicSearchHandler.js    # /music команда
│   │   │   └── statsHandler.js          # /stats команда
│   │   ├── voiceHandler.js              # Обработка голосовых
│   │   ├── textHandler.js               # Обработка текста и ссылок
│   │   └── actions/
│   │       └── youtubeDownloadAction.js # Кнопки YouTube
│   ├── middleware/
│   │   └── checkUserIsTrusted.js        # Проверка авторизации
│   └── index.js                         # Точка входа бота
├── services/
│   ├── media/
│   │   ├── instagram.js                 # Instagram downloader
│   │   ├── tiktok.js                    # TikTok downloader
│   │   ├── youtube.js                   # YouTube downloader
│   │   ├── x.js                         # X/Twitter downloader
│   │   └── music.js                     # Music search (Deezer API)
│   └── db.js                            # SQLite работа с БД
├── utils/
│   └── extractUrl.js                    # Извлечение URL из текста
└── models/
    └── TaskModel.js                     # Модель задач
```

## Основные компоненты

### Media Downloaders

| Файл | Источник | API |
|------|----------|-----|
| `instagram.js` | Instagram | `instagram-url-direct` |
| `tiktok.js` | TikTok | `tikwm.com` API |
| `youtube.js` | YouTube | `@distube/ytdl-core` |
| `x.js` | X/Twitter | `api.fxtwitter.com` |
| `music.js` | Music search | `api.deezer.com` |

### Команды бота

- `/music <query>` — поиск музыки
- `/stats` — статистика использования
- Голосовые — создание задач
- Ссылки — автоматическое скачивание

## Конфигурация

Файл `.env`:
```bash
TELEGRAM_TOKEN=xxx
AUTHORIZED_USERNAME=catanix
LM_API_KEY=xxx
```

## Запуск

```bash
# Разработка
npm run dev

# Продакшен (Docker)
npm run up
```

## Важные заметки

- TikTok: поддерживает ВСЕ поддомены (`vt.`, `vm.`, `www.`, `m.`)
- YouTube: выбирает оригинальное аудио (`audioIsDefault=true`)
- X: парсит через Fxtwitter API
- Music: Deezer API возвращает 30-секундные превью

## Docker

```bash
docker compose up -d --build
docker compose logs -f
```
