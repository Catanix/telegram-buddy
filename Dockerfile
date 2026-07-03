FROM node:20-slim

WORKDIR /app

# Install system deps for Playwright + native modules
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
    libasound2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy application code
COPY . .

# Create tmp directory
RUN mkdir -p tmp

# Expose port if needed
EXPOSE 3000

CMD ["npm", "start"]
