FROM node:18-slim

WORKDIR /app

# Установим git
RUN apt-get update && apt-get install -y git

# Скопируем локальный .git проект (если ты собираешь из папки)
COPY . .

# Установим зависимости (после git pull — с актуальными package.json)
RUN npm install

# Создаём tmp директорию
RUN mkdir -p tmp

ENV NODE_ENV=production

CMD ["npm", "start"]
