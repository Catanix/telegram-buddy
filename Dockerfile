FROM node:20-slim

WORKDIR /app

# Install dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create tmp directory
RUN mkdir -p tmp

# Expose port if needed
EXPOSE 3000

CMD ["npm", "start"]
