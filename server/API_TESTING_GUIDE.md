# API Testing Guide - Phase 3

## Prerequisites

1. **Start the embedding service** (if not running):
   ```bash
   cd embedding-service
   python -m uvicorn app.main:app --reload
   ```

2. **Start the API server**:
   ```bash
   cd server
   npm run dev
   ```

3. **Verify services are running**:
   - API Server: http://localhost:3000
   - Embedding Service: http://localhost:8000

---

## API Endpoints

### 1. Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "vibe-search-api"
}
```

**Test:**
```bash
curl http://localhost:3000/health
```

---

### 2. Text Search
**POST** `/api/search/text`

**Request Body:**
```json
{
  "query": "beach shorts for summer vacation",
  "top_k": 10,
  "filters": {
    "category": ["Bottoms"],
    "brands": ["Patagonia"],
    "price_range": [20, 100],
    "colors": ["Blue"]
  }
}
```

**Response:**
```json
{
  "query_understanding": {
    "original_query": "beach shorts for summer vacation",
    "intent": "find beach shorts for summer vacation",
    "extracted_keywords": ["beach", "shorts", "for", "summer", "vacation"],
    "expanded_terms": ["beach", "shorts", "for", "summer", "vacation", ...]
  },
  "inferred_context": {
    "category": "Bottoms",
    "use_case": "beach/shorts/for/summer/vacation",
    "style": []
  },
  "matches": [
    {
      "product_id": "PT-004",
      "name": "Patagonia Baggies 5\"",
      "title": "Patagonia Baggies 5\" Shorts Blue",
      "extracted_metadata": {...},
      "semantic_score": 0.85,
      "title_match_score": 0,
      "relevance_reasons": [],
      "matched_terms": ["shorts"],
      "image_url": "...",
      "price": 65.00
    }
  ],
  "search_strategy": "Hybrid: BM25 text search + semantic embeddings",
  "total_results": 5
}
```

**Test Examples:**

**Basic search:**
```bash
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "sneakers", "top_k": 5}'
```

**With filters:**
```bash
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 5,
    "filters": {
      "category": ["Footwear"],
      "brands": ["Nike", "Adidas"],
      "price_range": [50, 200]
    }
  }'
```

---

### 3. Image Search
**POST** `/api/search/image`

**Request Body:**
```json
{
  "external_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "top_k": 10,
  "filters": {
    "category": ["Footwear"],
    "brands": ["Nike"],
    "price_range": [50, 300],
    "colors": ["Black", "White"]
  },
  "rerank": true
}
```

**Response:**
```json
{
  "query_analysis": {
    "detected_items": [],
    "extracted_from_image": {
      "dominant_colors": [],
      "inferred_style": [],
      "detected_category": null
    }
  },
  "matches": [
    {
      "product_id": "NK-001",
      "name": "Nike Dunk Low",
      "title": "Nike Dunk Low Panda Black White Sneakers",
      "extracted_metadata": {...},
      "visual_score": 0.89,
      "combined_score": 0.89,
      "price": 110.00,
      "image_url": "...",
      "match_reasons": []
    }
  ],
  "total_results": 5,
  "search_time_ms": 0
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/search/image \
  -H "Content-Type: application/json" \
  -d '{
    "external_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 5
  }'
```

**Note:** Image search requires products to have visual embeddings. Currently, products may only have text embeddings.

---

### 4. Hybrid Search
**POST** `/api/search/hybrid`

**Request Body:**
```json
{
  "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "query": "black white sneakers",
  "top_k": 10,
  "filters": {
    "category": ["Footwear"]
  },
  "visual_weight": 0.6,
  "text_weight": 0.4
}
```

**Response:**
```json
{
  "matches": [
    {
      "product_id": "NK-001",
      "title": "Nike Dunk Low Panda Black White Sneakers",
      "extracted_metadata": {...},
      "visual_score": 0.89,
      "semantic_score": 0.82,
      "combined_score": 0.86,
      "price": 110.00,
      "image_url": "..."
    }
  ],
  "total_results": 5
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 5
  }'
```

---

## Quick Test Scripts

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

### HTTP File (VS Code REST Client)
Open `server/test-api.http` in VS Code and use the REST Client extension to run requests.

---

## Testing Checklist

- [ ] Health check returns 200
- [ ] Text search returns results
- [ ] Text search with filters works
- [ ] Image search returns results (if visual embeddings exist)
- [ ] Hybrid search combines both modes
- [ ] Error handling for invalid requests
- [ ] Filters work correctly (category, brand, price)

---

### 6. Scraped Images Search
**POST** `/api/search/scraped-images`

**Request Body:**
```json
{
  "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "query": "streetwear outfit",
  "top_k": 10,
  "platform": "pinterest"
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": 1,
      "image_url": "https://i.pinimg.com/...",
      "source_url": "https://www.pinterest.com/...",
      "source_platform": "pinterest",
      "caption": "...",
      "hashtags": ["streetwear", "fashion"],
      "engagement_metrics": {...},
      "posted_date": "2026-01-06T14:27:20.000Z",
      "user_info": {...},
      "similarity_score": 0.89
    }
  ],
  "total_results": 10
}
```

**Test Examples:**

**Search by image:**
```bash
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 10,
    "platform": "pinterest"
  }'
```

**Search by text:**
```bash
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "query": "streetwear",
    "top_k": 10,
    "platform": "pinterest"
  }'
```

---

## Common Issues

1. **"Models not loaded" error**: Wait for embedding service to finish loading models
2. **No results**: Check if products have embeddings (`npm run process:products`)
3. **Image search fails**: Products may not have visual embeddings (only text embeddings)
4. **Connection refused**: Ensure both services are running
5. **Scraped images search empty**: Ensure scraped images have embeddings (`npm run process:images`)

---

## Expected Results

With 8 products seeded:
- Text search should return relevant products based on semantic similarity
- Image search may return empty if products don't have visual embeddings
- Hybrid search will use text embeddings if visual embeddings are missing

