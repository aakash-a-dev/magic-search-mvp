# Vibe Search - Multimodal Fashion Search MVP

A sophisticated proof-of-concept pipeline with multimodal search capabilities, combining computer vision with natural language understanding.

## Tech Stack

- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL 15+ with pgvector extension
- **ORM**: Prisma
- **Scraping**: Playwright
- **Queue**: BullMQ (Redis)

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ with pgvector (or use Docker)

## Quick Start

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Initialize vector indexes** (run this SQL in your PostgreSQL client)
   ```bash
   psql -U postgres -d vibe_search -f server/prisma/init-vector-indexes.sql
   ```
   Or manually execute the SQL file contents in your database client.

6. **Seed sample products**
   ```bash
   npm run seed:products
   ```

7. **Run scrapers**
   ```bash
   npm run scrape:pinterest
   npm run scrape:instagram
   ```

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── services/        # Business logic
│   │   ├── scraper/     # Scraping services
│   │   └── database/    # Database services
│   ├── types/           # TypeScript types
│   └── scripts/         # CLI scripts
└── prisma/              # Database schema & migrations
```

## Environment Variables

See `.env.example` for required variables.

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:studio    # Open Prisma Studio
```

## License

ISC

