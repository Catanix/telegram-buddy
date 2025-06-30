FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git tzdata

# Копируем файлы проекта
COPY . .

# Устанавливаем зависимости
RUN npm install

# Создаём tmp директорию
RUN mkdir -p tmp

ENV NODE_ENV=production

CMD ["npm", "start"]
