FROM node:20-alpine

WORKDIR /app

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
