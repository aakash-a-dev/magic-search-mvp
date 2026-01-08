# Vibe Search - Multimodal Fashion Search System

A production-grade multimodal search engine that combines computer vision with natural language understanding to enable intelligent fashion product discovery. The system processes visual and textual data from social media platforms and cross-references them against an internal product catalog using hybrid search capabilities.

## Overview

Vibe Search is inspired by Shoppin's "Vibe Search" feature, implementing a sophisticated proof-of-concept pipeline that enables users to discover products through multiple search modalities:

- **Visual Search**: Upload or select images to find visually similar products
- **Textual Search**: Natural language queries with semantic understanding
- **Hybrid Search**: Combines visual similarity with contextual understanding
- **Social Media Integration**: Browse scraped fashion content from Pinterest and Instagram

## Architecture

The system is built on a microservices architecture with the following components:

### Core Services

1. **PostgreSQL Database** (with pgvector extension)
   - Stores products, scraped images, and vector embeddings
   - Enables efficient similarity search using cosine distance

2. **Embedding Service** (Python/FastAPI)
   - Generates visual embeddings using CLIP (Vision Transformer)
   - Generates text embeddings using Sentence Transformers
   - Handles batch processing for efficient embedding generation

3. **API Server** (Node.js/Express)
   - RESTful API endpoints for search operations
   - Manages product catalog and scraped image data
   - Orchestrates embedding generation and search queries

4. **Frontend** (Next.js/React)
   - User interface for browsing and searching
   - Gallery view for scraped images
   - Search interface with text and image input

### Data Pipeline

```
Social Media Platforms (Pinterest/Instagram)
    ↓
Scraper Service (Playwright)
    ↓
PostgreSQL Database
    ↓
Embedding Service (CLIP + Sentence Transformers)
    ↓
Vector Database (pgvector)
    ↓
Search Service (Hybrid Search)
    ↓
API Response
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with pgvector extension
- **ORM**: Prisma
- **Scraping**: Playwright (Chromium)
- **Queue**: BullMQ with Redis

### Embedding Service
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **Models**:
  - Visual: OpenAI CLIP ViT-B/32
  - Text: Sentence Transformers all-mpnet-base-v2

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **UI Library**: Tailwind CSS with shadcn/ui components
- **State Management**: React Hooks

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Vector Search**: pgvector (PostgreSQL extension)

## Quick Start

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Minimum 8GB RAM recommended
- Internet connection for initial model downloads
- Approximately 5GB disk space for Docker images and models

### Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repo-name>
   ```

2. **Configure environment variables** (optional)
   
   Create a `.env` file in the root directory if you need to customize settings:
   ```env
   INSTAGRAM_USERNAME=your_username
   INSTAGRAM_PASSWORD=your_password
   ```
   
   Note: Instagram credentials are optional. Scraping will work without them but may be rate-limited.

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This command will:
   - Start PostgreSQL database with pgvector extension
   - Start Redis for job queuing
   - Build and start the embedding service (downloads ML models on first run)
   - Build and start the API server
   - Run initialization script (database setup, seeding, scraping, embedding generation)
   - Build and start the frontend

4. **Monitor initialization progress**
   
   The initialization process runs automatically. Monitor progress with:
   ```bash
   docker-compose logs -f init
   ```
   
   Wait for the message: `Initialization complete!`

5. **Access the application**
   
   Once initialization is complete, open your browser and navigate to:
   ```
   http://localhost:3001
   ```

### Initialization Process

The initialization container (`init`) performs the following operations automatically:

1. Database schema setup and migration
2. Vector index creation for efficient similarity search
3. Product catalog seeding (60 sample products)
4. Product embedding generation (visual and text embeddings)
5. Social media scraping (Pinterest and Instagram)
6. Scraped image embedding generation

**Initialization Timeline**:
- **First Run**: 10-15 minutes
  - Model downloads: ~5 minutes (CLIP and Sentence Transformers, ~2GB)
  - Database setup: ~1 minute
  - Product seeding and embedding: ~2 minutes
  - Scraping operations: ~5-10 minutes (depends on network speed)
  - Scraped image embedding: ~2 minutes

- **Subsequent Runs**: 2-3 minutes (models cached, only data processing)

**Verification**:
```bash
# Check all services are running
docker-compose ps

# Check initialization logs
docker-compose logs init | tail -20

# Verify embeddings were created
docker-compose exec server npm run verify:embeddings
```

## API Documentation

### Base URL
```
http://localhost:3000/api/search
```

### Endpoints

#### Health Check
```
GET /health
```
Returns service health status.

#### Text Search
```
POST /api/search/text
Content-Type: application/json

{
  "query": "beach shorts for summer vacation",
  "top_k": 10,
  "filters": {
    "category": ["Bottoms"],
    "price_range": [20, 100],
    "brands": ["Patagonia", "Ralph Lauren"]
  }
}
```

**Response**:
```json
{
  "query_understanding": {
    "original_query": "beach shorts for summer vacation",
    "intent": "find casual summer bottoms",
    "extracted_keywords": ["beach", "shorts", "summer", "vacation"],
    "expanded_terms": ["swim trunks", "board shorts", "summer shorts"]
  },
  "matches": [
    {
      "product_id": "PT-004",
      "title": "Patagonia Baggies 5\" Shorts Blue",
      "semantic_score": 0.94,
      "title_match_score": 0.87,
      "price": 65.00,
      "image_url": "...",
      "relevance_reasons": [
        "Title contains 'shorts' - exact category match",
        "High semantic similarity: 94%"
      ]
    }
  ],
  "total_results": 23
}
```

#### Image Search
```
POST /api/search/image
Content-Type: application/json

{
  "external_image_url": "https://example.com/image.jpg",
  "top_k": 10,
  "filters": {
    "category": ["Footwear"],
    "price_range": [50, 300],
    "brands": ["Nike", "Adidas"]
  }
}
```

**Response**:
```json
{
  "query_analysis": {
    "detected_items": ["sneakers"],
    "extracted_from_image": {
      "dominant_colors": ["white", "black"],
      "inferred_style": ["streetwear", "minimal"],
      "detected_category": "Footwear"
    }
  },
  "matches": [
    {
      "product_id": "NK-001",
      "title": "Nike Dunk Low Panda Black White Sneakers",
      "visual_score": 0.89,
      "semantic_score": 0.82,
      "combined_score": 0.86,
      "price": 110.00,
      "image_url": "...",
      "match_reasons": [
        "Similar silhouette and shape",
        "Matching black/white colorway"
      ]
    }
  ],
  "total_results": 45
}
```

#### Search from Scraped Image
```
POST /api/search/from-scraped-image
Content-Type: application/json

{
  "scraped_image_id": 42,
  "top_k": 10,
  "filters": {
    "category": ["Footwear", "Accessories"]
  }
}
```

Searches products using a scraped image as the query source.

#### Get Scraped Images
```
GET /api/search/scraped-images?limit=50&offset=0&platform=pinterest
```

Returns scraped images for gallery display. Supports filtering by platform (pinterest/instagram).

## Data Models

### Product Schema
```typescript
{
  product_id: string (unique)
  title: string
  category: string
  brand_name: string | null
  image_url: string
  price: decimal
  extracted_metadata: jsonb
  visual_embedding: vector(512)
  text_embedding: vector(768)
}
```

### Scraped Image Schema
```typescript
{
  id: number
  image_url: string
  source_url: string | null
  source_platform: 'pinterest' | 'instagram'
  caption: string | null
  hashtags: string[]
  engagement_metrics: jsonb
  posted_date: datetime | null
  user_info: jsonb
  embedding: vector(512)
}
```

## Search Implementation

### Visual Embeddings
- **Model**: OpenAI CLIP ViT-B/32
- **Dimension**: 512
- **Purpose**: Captures visual features including:
  - Item type and category
  - Color schemes
  - Style and aesthetics
  - Brand visual identity
  - Use context (formal/casual/sports)

### Text Embeddings
- **Model**: Sentence Transformers all-mpnet-base-v2
- **Dimension**: 768
- **Purpose**: Semantic understanding of:
  - Product titles and descriptions
  - User search queries
  - Scraped image captions and hashtags

### Hybrid Search Strategy

The system combines multiple search approaches:

1. **Vector Similarity Search**: Cosine distance on embeddings
2. **Keyword Matching**: BM25-style title and category matching
3. **Metadata Filtering**: Brand, category, price range filters
4. **Score Fusion**: Weighted combination of visual and semantic scores

### Query Expansion

Text queries are automatically expanded with:
- Synonyms (e.g., "beach shorts" → "swim trunks", "board shorts")
- Related terms (e.g., "tracking shoes" → "hiking boots", "trail runners")
- Contextual understanding (e.g., "summer vacation" → casual, beach-appropriate items)

## Scraping Configuration

### Pinterest Sources
The system scrapes from the following Pinterest boards:
- Minimal Streetwear
- Men's Streetwear Outfit Ideas
- Streetwear Outfit Ideas
- Streetwear Fashion Instagram
- Luxury Fashion – Roxx Inspire
- Luxury Classy Outfits
- Luxury Streetwear Brands

### Instagram Sources
The system scrapes from the following Instagram profiles:
- @minimalstreetstyle
- @outfitgrid
- @outfitpage
- @mensfashionpost
- @stadiumgoods
- @flightclub
- @hodinkee
- @wristcheck
- @purseblog
- @sunglasshut
- @rayban
- @prada
- @cartier
- @thesolesupplier

### Scraping Metadata
Each scraped image includes:
- Image URL and source link
- Post caption/description
- Hashtags and tags
- Engagement metrics (likes, comments) when available
- Posted date
- User/brand information

## Performance Considerations

### Vector Indexing
The system uses IVFFlat indexes on all embedding columns for efficient similarity search:
- Index type: IVFFlat with cosine distance
- Lists parameter: 100 (optimized for datasets with 1000-10000 vectors)

### Embedding Generation
- Batch processing for efficient model inference
- Caching of embeddings to avoid regeneration
- Asynchronous processing for large datasets

### API Response Times
- Target: <500ms (p95) for search queries
- Embedding generation: <100ms per image
- Database queries optimized with proper indexing

## Development

### Project Structure
```
.
├── server/                 # Node.js API server
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   │   ├── database/  # Database services
│   │   │   ├── embedding/ # Embedding processing
│   │   │   ├── scraper/   # Scraping services
│   │   │   └── search/    # Search services
│   │   ├── scripts/       # CLI scripts
│   │   └── config/        # Configuration
│   └── prisma/            # Database schema
├── embedding-service/      # Python embedding service
│   └── app/
│       ├── routers/       # API routes
│       ├── services/      # ML model services
│       └── utils/         # Utilities
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── lib/              # Utilities and API client
└── docker-compose.yml    # Service orchestration
```

### Running Services Individually

#### Database Setup
```bash
cd server
npm install
npm run db:generate
npm run db:push
```

#### Embedding Service
```bash
cd embedding-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### API Server
```bash
cd server
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Management

#### Prisma Studio
```bash
cd server
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

#### Manual Database Access
```bash
docker exec -it vibe_search_db psql -U postgres -d vibe_search
```

### Scripts

#### Manual Steps Using Docker

All commands below should be run from the project root directory. Ensure Docker services are running first:

```bash
# Check services are up
docker-compose ps

# Services should show: postgres, embedding-service, redis, server
```

##### 1. Seed Products

Seed the database with sample products (60 products):

```bash
# Run seed script inside the server container
docker-compose exec server npm run seed:products
```

**What this does:**
- Clears existing products from the database
- Seeds 60 sample fashion products (shoes, clothing, accessories)
- Products are saved to PostgreSQL (embeddings not generated yet)

**Expected output:**
```
Clearing existing products...
✓ Deleted X existing products
Seeding products...
✓ Seeded 60 products
✓ Total products in database: 60
```

##### 2. Scrape Pinterest

Scrape fashion images from Pinterest boards:

```bash
# Scrape Pinterest boards
docker-compose exec server npm run scrape:pinterest
```

**What this does:**
- Launches headless Chromium browser
- Navigates to Pinterest search pages
- Extracts images, captions, hashtags, and metadata
- Saves scraped images to `scraped_images` table

**Scraped sources:**
- Minimal Streetwear
- Men's Streetwear Outfit Ideas
- Streetwear Outfit Ideas
- Luxury Fashion
- Luxury Classy Outfits
- Luxury Streetwear Brands

**Expected output:**
```
Starting Pinterest scraping...
Scraping: Minimal Streetwear...
✓ Scraped 15 images from Minimal Streetwear
...
✓ Total images scraped: 100
```

**Note:** Scraping may take 5-10 minutes depending on network speed and rate limits.

##### 3. Scrape Instagram

Scrape fashion images from Instagram profiles:

```bash
# Scrape Instagram profiles (requires credentials in .env)
docker-compose exec server npm run scrape:instagram
```

**Prerequisites:**
- Add Instagram credentials to `.env` file (optional but recommended):
  ```env
  INSTAGRAM_USERNAME=your_username
  INSTAGRAM_PASSWORD=your_password
  ```

**What this does:**
- Launches headless Chromium browser
- Logs into Instagram (if credentials provided)
- Navigates to fashion profile pages
- Extracts posts with images, captions, likes, and metadata
- Saves scraped images to `scraped_images` table

**Scraped profiles:**
- @minimalstreetstyle
- @outfitgrid
- @stadiumgoods
- @flightclub
- @rayban
- @prada
- And more...

**Expected output:**
```
Scraping Instagram...
Scraping profile: @minimalstreetstyle...
✓ Scraped 20 images from @minimalstreetstyle
...
✓ Total images scraped: 150
```

**Note:** 
- Without credentials, scraping may be limited or fail (expected behavior)
- Instagram may require login for private profiles
- Rate limiting may occur - scraping will continue with warnings

##### 4. Generate Embeddings

Generate vector embeddings for products and scraped images:

**4a. Process Product Embeddings**

Generate visual and text embeddings for all products:

```bash
# Process all products
docker-compose exec server npm run process:products
```

**What this does:**
- Checks embedding service is ready
- For each product:
  - Downloads product image
  - Generates visual embedding (512-dim vector using CLIP)
  - Generates text embedding (768-dim vector using Sentence Transformers)
  - Extracts metadata (brand, category, colors, style)
  - Saves embeddings to database

**Expected output:**
```
Checking embedding service health...
Checking if models are loaded...
✓ Embedding service is ready

Processing all products...
Processing product NK-001...
✓ Successfully processed product NK-001
...
✓ Processing complete:
  Success: 60
  Failed: 0
```

**Process single product:**
```bash
# Process specific product by ID
docker-compose exec server npm run process:products NK-001
```

**4b. Process Scraped Image Embeddings**

Generate visual embeddings for scraped images:

```bash
# Process all scraped images
docker-compose exec server npm run process:images
```

**What this does:**
- Gets all scraped images from database
- For each image:
  - Downloads image from source URL
  - Generates visual embedding (512-dim vector using CLIP)
  - Saves embedding to `scraped_image_embeddings` table

**Expected output:**
```
Checking embedding service health...
✓ Embedding service is ready

Processing all scraped images...
Processing scraped image 1...
✓ Successfully processed scraped image 1
...
✓ Processing complete:
  Success: 150
  Failed: 0
```

**Process single scraped image:**
```bash
# Process specific image by ID
docker-compose exec server npm run process:images 42
```

**Note:** 
- Ensure embedding service is running and models are loaded
- Processing time: ~100ms per image
- Large batches may take several minutes

##### 5. Verify Embeddings

Check the status of all embeddings:

```bash
# Verify embeddings status
docker-compose exec server npm run verify:embeddings
```

**What this shows:**
- Total products vs products with embeddings
- Total scraped images vs images with embeddings
- Missing embeddings (if any)
- Sample embedding data

**Expected output:**
```
🔍 Verifying Embeddings...

📊 PRODUCT EMBEDDINGS:
  Total Products: 60
  ✅ Text Embeddings: 60 (100.0%)
  ✅ Visual Embeddings: 60 (100.0%)

📊 SCRAPED IMAGE EMBEDDINGS:
  Total Scraped Images: 150
  ✅ Visual Embeddings: 150 (100.0%)

🎉 All embeddings are correctly stored!
```

#### Complete Manual Setup Workflow

Run all steps in sequence:

```bash
# 1. Ensure services are running
docker-compose up -d postgres embedding-service redis server

# 2. Wait for embedding service to load models (~5 minutes)
docker-compose logs -f embedding-service
# Look for: "All models loaded successfully"

# 3. Setup database schema (if not already done)
docker-compose exec server npm run db:push

# 4. Initialize vector indexes
docker-compose exec server psql -h postgres -U postgres -d vibe_search -f prisma/init-vector-indexes.sql

# 5. Seed products
docker-compose exec server npm run seed:products

# 6. Generate product embeddings
docker-compose exec server npm run process:products

# 7. Scrape Pinterest
docker-compose exec server npm run scrape:pinterest

# 8. Scrape Instagram (optional)
docker-compose exec server npm run scrape:instagram

# 9. Generate scraped image embeddings
docker-compose exec server npm run process:images

# 10. Verify everything
docker-compose exec server npm run verify:embeddings
```

#### Running Scripts Locally (Without Docker)

If you prefer to run scripts locally instead of in Docker:

```bash
# Seed products
cd server
npm run seed:products

# Process embeddings
npm run process:products
npm run process:images

# Scraping
npm run scrape:pinterest
npm run scrape:instagram

# Verification
npm run verify:embeddings
```

**Note:** For local execution, ensure:
- Services are running (PostgreSQL, embedding-service, Redis)
- Environment variables are set in `.env`
- Dependencies are installed (`npm install`)

## Troubleshooting

### Services Not Starting
1. Check Docker is running: `docker ps`
2. Check logs: `docker-compose logs [service-name]`
3. Verify ports are not in use: `netstat -an | grep [port]`

### Embedding Service Issues
1. Check model downloads completed: `docker-compose logs embedding-service`
2. Verify sufficient memory (models require ~2GB RAM)
3. Check service health: `curl http://localhost:8000/health`

### Database Connection Errors
1. Verify PostgreSQL is healthy: `docker-compose ps postgres`
2. Check DATABASE_URL environment variable
3. Verify pgvector extension: `docker exec -it vibe_search_db psql -U postgres -d vibe_search -c "SELECT * FROM pg_extension WHERE extname='vector';"`

### Scraping Failures
1. Instagram scraping may fail without credentials (expected)
2. Rate limiting may occur - scraping will retry automatically
3. Check network connectivity for external image downloads

### No Search Results
1. Verify embeddings exist: `npm run verify:embeddings`
2. Check product data: `npm run db:studio`
3. Verify embedding service is responding: `curl http://localhost:8000/health/ready`

## Model Configuration

### Visual Embedding Model
- **Model**: `openai/clip-vit-base-patch32`
- **Alternative**: `openai/clip-vit-large-patch14` (requires more GPU memory)
- **Dimension**: 512
- **Use Case**: Image-to-image similarity, visual feature extraction

### Text Embedding Model
- **Model**: `sentence-transformers/all-mpnet-base-v2`
- **Alternative**: `sentence-transformers/all-MiniLM-L6-v2` (faster, less accurate)
- **Dimension**: 768
- **Use Case**: Semantic text search, query understanding

Model configuration can be modified in `embedding-service/app/config.py`.

## Security Considerations

1. **Environment Variables**: Never commit credentials to version control
2. **Rate Limiting**: API endpoints include rate limiting to prevent abuse
3. **Input Validation**: All API inputs are validated using Zod schemas
4. **Database Security**: Use strong passwords in production environments
5. **Scraping Ethics**: Respect robots.txt and rate limits of scraped platforms

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use secure secret management
2. **Database**: Use managed PostgreSQL with automated backups
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN**: Use CDN for static assets and image serving
5. **Monitoring**: Implement logging and monitoring (e.g., Prometheus, Grafana)
6. **Scaling**: Use container orchestration (Kubernetes) for horizontal scaling
7. **SSL/TLS**: Enable HTTPS for all services

## License

ISC

## References

- [Shoppin App](https://apps.apple.com/in/app/shoppin/id6738202299)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Prisma Documentation](https://www.prisma.io/docs)
