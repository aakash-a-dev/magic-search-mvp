# Complete Setup and Testing Guide

## 🚀 Complete Setup Steps

### Step 1: Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait 10 seconds for PostgreSQL to initialize
```

### Step 2: Setup Database

```bash
cd server

# Install dependencies (if not done)
npm install

# Setup database (enables pgvector, runs migrations)
npm run db:setup
```

### Step 3: Start Embedding Service (Python)

```bash
# In a new terminal
cd embedding-service

# Install dependencies (if not done)
pip install -r requirements.txt

# Start the service
python -m uvicorn app.main:app --reload --port 8000
```

**Wait for models to load** (you'll see: `Models loaded successfully`)

### Step 4: Start API Server (Node.js)

```bash
# In another terminal
cd server

# Start the server
npm run dev
```

Server should start on `http://localhost:3000`

---

## 📊 Data Setup Steps

### Step 5: Seed Products (60 products)

```bash
cd server
npm run seed:products
```

**Expected output:**
```
Seeding products...
✓ Seeded 60 products
```

### Step 6: Scrape Images (Pinterest & Instagram)

```bash
# Scrape Pinterest (50+ images)
npm run scrape:pinterest

# Scrape Instagram (50+ images)
npm run scrape:instagram
```

**Expected output:**
```
Scraping Pinterest board: minimal-streetwear
Found 50 images
Scraping complete: 50 images saved
```

### Step 7: Generate Embeddings

```bash
# Process products (generate embeddings)
npm run process:products

# Process scraped images (generate embeddings)
npm run process:images
```

**Expected output:**
```
Processing products...
Success: 60, Failed: 0

Processing scraped images...
Success: 110, Failed: 0
```

---

## 🧪 Complete API Testing

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "service": "vibe-search-api"
}
```

---

### Test 2: Get Unified Data (Scraped Images + Products)

```bash
# Get both scraped images and products together
curl "http://localhost:3000/api/search/unified?scraped_limit=20&products_limit=20"
```

**Or with platform filter:**
```bash
curl "http://localhost:3000/api/search/unified?scraped_limit=20&products_limit=20&platform=pinterest"
```

**Expected Response:**
```json
{
  "scraped_images": {
    "items": [
      {
        "id": 1,
        "image_url": "https://i.pinimg.com/...",
        "source_url": "https://www.pinterest.com/...",
        "source_platform": "pinterest",
        "caption": "...",
        "hashtags": ["streetwear", "fashion"],
        "engagement_metrics": {...},
        "posted_date": "2026-01-06T14:27:20.000Z",
        "user_info": {...}
      }
    ],
    "total": 20,
    "limit": 20,
    "offset": 0
  },
  "products": {
    "items": [
      {
        "product_id": "NK-001",
        "title": "Nike Dunk Low Panda Black White Sneakers",
        "category": "Footwear",
        "brand_name": "Nike",
        "image_url": "https://images.unsplash.com/...",
        "price": 110.00,
        "extracted_metadata": {...}
      }
    ],
    "total": 20,
    "limit": 20,
    "offset": 0
  }
}
```

---

### Test 3: Get Scraped Images Gallery

```bash
# Get all scraped images
curl "http://localhost:3000/api/search/scraped-images?limit=50"

# Get Pinterest images only
curl "http://localhost:3000/api/search/scraped-images?platform=pinterest&limit=50"

# Get Instagram images only
curl "http://localhost:3000/api/search/scraped-images?platform=instagram&limit=50"
```

---

### Test 4: Get Products

```bash
# Get all products
curl "http://localhost:3000/api/search/products?limit=50"
```

---

### Test 5: Search Products by Text

```bash
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 10
  }'
```

**With filters:**
```bash
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 10,
    "filters": {
      "category": ["Footwear"],
      "brands": ["Nike", "Adidas"],
      "price_range": [50, 200]
    }
  }'
```

---

### Test 6: Search Products by Image

```bash
curl -X POST http://localhost:3000/api/search/image \
  -H "Content-Type: application/json" \
  -d '{
    "external_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 10
  }'
```

---

### Test 7: Hybrid Search (Image + Text)

```bash
curl -X POST http://localhost:3000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "query": "black white sneakers",
    "top_k": 10,
    "visual_weight": 0.6,
    "text_weight": 0.4
  }'
```

---

### Test 8: Click Scraped Image → Search Products

```bash
# First, get a scraped image ID from the gallery
# Then use it to search products
curl -X POST http://localhost:3000/api/search/from-scraped-image \
  -H "Content-Type: application/json" \
  -d '{
    "scraped_image_id": 1,
    "top_k": 10,
    "filters": {
      "category": ["Footwear"],
      "price_range": [50, 200]
    }
  }'
```

---

### Test 9: Search Scraped Images (Internal Use)

```bash
# Search other scraped images by image
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 10,
    "platform": "pinterest"
  }'

# Search scraped images by text
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "query": "streetwear",
    "top_k": 10,
    "platform": "pinterest"
  }'
```

---

## 🎯 Quick Test Script

### PowerShell (Windows)

```powershell
cd server
.\test-api.ps1
```

### Bash (Linux/Mac)

```bash
cd server
chmod +x test-api.sh
./test-api.sh
```

### VS Code REST Client

Open `server/test-api.http` and click "Send Request" above each request.

---

## 📋 Complete Testing Checklist

### Setup ✅
- [ ] Docker services running (PostgreSQL, Redis)
- [ ] Embedding service running on port 8000
- [ ] API server running on port 3000
- [ ] Database setup complete

### Data ✅
- [ ] 60 products seeded
- [ ] 50+ Pinterest images scraped
- [ ] 50+ Instagram images scraped
- [ ] Product embeddings generated
- [ ] Scraped image embeddings generated

### API Endpoints ✅
- [ ] Health check works
- [ ] Unified endpoint returns both scraped images and products
- [ ] Scraped images gallery works
- [ ] Products list works
- [ ] Text search returns products
- [ ] Image search returns products
- [ ] Hybrid search works
- [ ] Click-to-search (from scraped image) works
- [ ] Scraped images search works

---

## 🔍 Verify Data in Database

### Using Prisma Studio

```bash
cd server
npm run db:studio
```

Check:
- `products` table: Should have 60 products
- `scraped_images` table: Should have 110+ images
- `product_visual_embeddings`: Should have 60 embeddings
- `product_text_embeddings`: Should have 60 embeddings
- `scraped_image_embeddings`: Should have 110+ embeddings

---

## 🐛 Troubleshooting

### Issue: "Models not loaded"
**Solution:** Wait for embedding service to finish loading models (check terminal output)

### Issue: "No products with visual embeddings"
**Solution:** Run `npm run process:products` to generate embeddings

### Issue: "No scraped images found"
**Solution:** Run scraping scripts: `npm run scrape:pinterest` and `npm run scrape:instagram`

### Issue: "Connection refused"
**Solution:** Ensure all services are running:
- Docker services: `docker-compose ps`
- Embedding service: Check port 8000
- API server: Check port 3000

### Issue: "Database connection error"
**Solution:** 
1. Check Docker: `docker-compose ps`
2. Check `.env` file has correct `DATABASE_URL`
3. Restart services: `docker-compose restart postgres`

---

## 📊 Expected Results Summary

| Endpoint | Expected Results |
|----------|------------------|
| `/api/search/unified` | 20 scraped images + 20 products |
| `/api/search/scraped-images` | 50 scraped images |
| `/api/search/products` | 60 products |
| `/api/search/text` | 5-10 matching products |
| `/api/search/image` | 5-10 matching products (if visual embeddings exist) |
| `/api/search/hybrid` | 5-10 matching products |
| `/api/search/from-scraped-image` | 5-10 matching products |

---

## 🎉 Success Criteria

✅ All endpoints return 200 status  
✅ Unified endpoint returns both scraped images and products  
✅ Text search returns relevant products  
✅ Image search returns products (if embeddings exist)  
✅ Click-to-search works with scraped images  
✅ No errors in console/logs  

---

## 📝 Next Steps

1. **Frontend Integration**: Use `/api/search/unified` to display both scraped images and products
2. **Click Handler**: Use `/api/search/from-scraped-image` when user clicks a scraped image
3. **Search Bar**: Use `/api/search/text` for text queries
4. **Image Upload**: Use `/api/search/image` for uploaded images


