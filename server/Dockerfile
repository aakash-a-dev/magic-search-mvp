FROM node:18-slim

WORKDIR /app

# Install Playwright dependencies and PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (this will run postinstall script to install Playwright browsers)
RUN npm ci

# Install Playwright browsers with system dependencies
RUN npx playwright install chromium --with-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate || true

EXPOSE 3000

CMD ["npm", "run", "dev"]

