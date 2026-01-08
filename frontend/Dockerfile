FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]

