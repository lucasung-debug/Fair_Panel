FROM node:22-slim

WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application source files
COPY . .

# Build frontend production bundle
RUN npm run build

# Cloud Run environment settings
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
