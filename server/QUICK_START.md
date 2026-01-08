# Quick Start Guide

## 🚀 One-Command Setup (After Initial Setup)

```bash
# Terminal 1: Start Docker
docker-compose up -d postgres redis

# Terminal 2: Start Embedding Service
cd embedding-service && python -m uvicorn app.main:app --reload --port 8000

# Terminal 3: Start API Server
cd server && npm run dev
```

---

## 📊 Data Setup (One Time)

```bash
cd server

# 1. Setup database
npm run db:setup

# 2. Seed 60 products
npm run seed:products

# 3. Scrape images (Pinterest + Instagram)
npm run scrape:pinterest
npm run scrape:instagram

# 4. Generate embeddings
npm run process:products
npm run process:images
```

---

## 🎯 Get Both Scraped Images + Products Together

### Single API Call

```bash
curl "http://localhost:3000/api/search/unified?scraped_limit=20&products_limit=20"
```

**Response includes:**
- `scraped_images.items[]` - Array of scraped images
- `products.items[]` - Array of products

### With Platform Filter

```bash
curl "http://localhost:3000/api/search/unified?scraped_limit=20&products_limit=20&platform=pinterest"
```

---

## 🧪 Quick Test

```bash
cd server
.\test-api.ps1    # Windows
./test-api.sh     # Linux/Mac
```

---

## 📋 All Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search/unified` | GET | **Get both scraped images + products** |
| `/api/search/products` | GET | Get all products |
| `/api/search/scraped-images` | GET | Get scraped images gallery |
| `/api/search/text` | POST | Search products by text |
| `/api/search/image` | POST | Search products by image |
| `/api/search/hybrid` | POST | Hybrid search (image + text) |
| `/api/search/from-scraped-image` | POST | Click scraped image → search products |
| `/api/search/scraped-images` | POST | Search scraped images (internal) |

---

## ✅ Verification

```bash
# Check health
curl http://localhost:3000/health

# Get unified data
curl "http://localhost:3000/api/search/unified?scraped_limit=10&products_limit=10"
```

**Expected:**
- Health: `{"status": "healthy"}`
- Unified: Both `scraped_images` and `products` arrays with data

---

See `COMPLETE_SETUP_AND_TESTING.md` for detailed instructions.


