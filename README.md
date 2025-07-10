# Telegram buddy

Telegram бот-помощник для быстрых напоминаний с помощью голосовых сообщений и скачивания медиа без авторизации с instagram/tiktok

## Возможности

- Создание задач через голосовые сообщения (распознание текста и времени задачи)
- Отправка напоминаний о задачах в указанное время
- Скачивание медиа по ссылке Instagram
- Скачивание медиа по ссылке TikTok
- Скачивание медиа по ссылке YouTube


## Установка

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/Catanix/telegram-buddy.git
   cd telegram-buddy
   ```

2. Установите зависимости:
   ```
   npm install
   ```

3. Создайте файл `.env` и заполните его, либо используйте скрипт для создания файла:
   ```
   npm run setup
   
   или
   
   cp .env.example .env
   ```

4. Отредактируйте файл `.env`, указав:
   - `TELEGRAM_TOKEN` - токен вашего Telegram бота (получите у [@BotFather](https://t.me/BotFather))
   - `AUTHORIZED_USERNAME` - ваш username в Telegram (без символа @)
   - `LM_API_KEY` - ключ API для сервиса Chatgpt/DeepSeek

## Запуск

### Обычный запуск

```
npm run start
```

### Запуск с помощью Docker

1. Настройте переменные окружения одним из способов:

   **Способ 1**: Используйте скрипт настройки:
   ```
   npm run setup
   ```

2. Запустите контейнер с помощью Docker Compose:
   ```
   npm run up
   
   или
   
   docker compose up -d
   ```

3. Проверьте логи:
   ```
   docker compose logs -f
   ```

#### Управление контейнером

- Остановка контейнера:
  ```
  npm run down
   
  или
  
  docker compose down
  ```

- Перезапуск контейнера:
  ```
  docker compose restart
  ```

- Обновление после изменения кода:
  ```
  docker compose up -d --build
  ```

## Технологии

- Node.js
- Telegraf (Telegram Bot API)
- SQLite
