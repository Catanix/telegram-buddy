FROM node:18-alpine

WORKDIR /app

# Установим git (нужен для git pull)
RUN apk add --no-cache git

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь код
COPY . .

# Создаём tmp директорию
RUN mkdir -p tmp

# Установим переменные окружения
ENV NODE_ENV=production

# Запускаем с git pull перед npm start
CMD sh -c "git pull origin main || true && npm start"
