# Telegram Buddy 🤖

Telegram бот для извлечения контента из социальных сетей и саммаризации обсуждений в группах с помощью DeepSeek AI.

## Возможности

### Для личных чатов
- **Авто-скачивание** — отправь ссылку и бот автоматически скачает контент
  - Поддержка каруселей Instagram (все фото/видео одним альбомом)
  - YouTube Shorts и обычные видео (без выбора качества, оригинальный аудио)
- **Поиск музыки** — команда `/music <запрос>`
- **Статистика** — команда `/stats`

### Для групп (требуется разрешение админа)
- **Извлечение контента** — команда `/unzip` (ответом на сообщение со ссылкой)
- **Саммаризация обсуждения** — команда `/summary` (анализ последних 100 сообщений через DeepSeek)
- **Поддержка платформ**: TikTok, Instagram, YouTube, X (Twitter)

### Управление доступом
- Бот присылает запрос в ЛС при добавлении в группу
- Админ подтверждает через кнопки ✅/❌
- Каждая группа имеет изолированную историю сообщений (до 100 сообщений, автоочистка через 7 дней)

## Архитектура

```
src/
├── bot/
│   ├── handlers/
│   │   ├── textHandler.js          # Авто-скачивание в личных чатах
│   │   ├── commands/
│   │   │   ├── groupCommands.js    # /unzip, /summary
│   │   │   ├── musicSearchHandler.js
│   │   │   └── statsHandler.js
│   │   └── actions/
│   │       └── groupPermissionActions.js  # ✅/❌ кнопки
│   └── middleware/
│       └── checkAccess.js          # Проверка прав доступа
├── services/
│   ├── media/
│   │   ├── instagram.js            # Playwright embed scraper (без куков!)
│   │   ├── tiktok.js               # Прямое скачивание видео
│   │   ├── youtube.js              # yt-dlp wrapper (Shorts + видео)
│   │   ├── x.js                    # Twitter/X scraper
│   │   └── music.js                # Поиск музыки
│   ├── api/
│   │   ├── lm_api.js               # Абстракция LLM-провайдера
│   │   └── summarize.js            # DeepSeek саммаризация
│   ├── database/
│   │   ├── index.js                # SQLite connection
│   │   └── messages.js             # CRUD операции с сообщениями
│   ├── db.js                       # Статистика (wrapper над database/index.js)
│   └── groupPermissions.js         # Логика доступа к группам
├── models/
│   └── GroupPermissionsModel.js
├── utils/
│   ├── extractUrl.js               # Определение платформы по URL
│   └── logger.js
└── config/
    └── index.js                    # Environment variables
```

### Ключевые решения
- **Изолированные download-функции** — `downloadYouTubeMedia(url)`, `downloadInstagramMedia(url)` не зависят от Telegram context, легко тестируются
- **Playwright для Instagram** — открывает embed-страницу, кликает по стрелкам карусели, собирает все media URL без куков и авторизации
- **yt-dlp для YouTube** — надёжнее `ytdl-core`, скачивает best combined format сразу с аудио
- **Stateless дизайн** — всё состояние в SQLite, бот масштабируется горизонтально

## RAILGUN Methodology

Проект следует методологии **RAILGUN** для структурированной разработки:

- **Command Center:** `.railgun/AGENTS.md`
- **Rail Protocol:** `.railgun/rail-protocol.md`
- **Слои:**
  - `00-runtime` — Активные спринты, временные правила
  - `01-domain` — Сущности, нейминг, модели, потоки
  - `02-blueprint` — Архитектура, паттерны, handler chain
  - `03-validation` — Manual testing plan
  - `04-guardrails` — Security, чеклисты, commit format

Каждая задача проходит 3 фазы: **Discovery → Execution → Final Gate**.

## Установка

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/Catanix/telegram-buddy.git
   cd telegram-buddy
   ```

2. Создайте `.env` файл:
   ```bash
   cp .env.example .env
   ```

3. Заполните `.env`:
   ```
   TELEGRAM_TOKEN=your_bot_token
   AUTHORIZED_USERNAME=your_telegram_username
   ADMIN_CHAT_ID=your_chat_id
   LM_PROVIDER=Deepseek
   LM_API_KEY=your_deepseek_key
   ```

## Запуск

### Docker (рекомендуется)
```bash
# Сборка и запуск
docker compose up -d --build

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Остановка
docker compose down
```

### Локально
```bash
npm install
npm start
```

## Команды

| Команда | Описание | Где работает |
|---------|----------|--------------|
| `/start` | Информация о боте | Везде |
| `/music <запрос>` | Поиск музыки | Личный чат |
| `/stats` | Статистика использования | Личный чат |
| `/unzip` | Извлечь контент по ссылке | Группы (с разрешением) |
| `/summary` | Саммаризация обсуждения | Группы (с разрешением) |

## Поддерживаемые платформы

| Платформа | Тип контента | Особенности |
|-----------|-------------|-------------|
| **TikTok** | Видео | Прямое скачивание |
| **Instagram** | Посты, Reels, Карусели | Playwright embed scraper, без куков |
| **YouTube** | Видео, Shorts | yt-dlp, best combined format, оригинальный аудио |
| **X (Twitter)** | Текст, Фото, Видео | Саммаризация + медиа |

## Технологии

- **Node.js 20** — Runtime
- **Telegraf.js** — Telegram Bot Framework
- **SQLite** — Локальная база данных
- **Playwright** — Headless browser для Instagram
- **yt-dlp** — YouTube/Shorts downloader (binary)
- **DeepSeek API** — AI саммаризация
- **Docker** — Контейнеризация

## Лицензия

MIT
