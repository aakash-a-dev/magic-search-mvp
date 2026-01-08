# Scraped Data Usage - According to PDF Requirements

## What the PDF Says About Scraped Data

From `full-stack-dev-task-2025.pdf`:

> **"Cross-reference against internal product database using hybrid search"**
> 
> **"Click to Search: Click any image → show matches"**
> 
> **Frontend Features:**
> - Gallery View: All scraped images in grid
> - Click to Search: Click any image → show matches (PRODUCTS)
> - Text Search Bar: Natural language queries

## Key Understanding

**Scraped images are the QUERY SOURCE, not the search target.**

- ✅ **Correct**: Click scraped image → Search PRODUCTS → Show matching products
- ❌ **Wrong**: Click scraped image → Search other scraped images → Show similar scraped images

---

## Implementation Status

### ✅ What We Have (Correct)

1. **GET `/api/search/scraped-images`** - Gallery view endpoint
   - Returns all scraped images for display in frontend gallery
   - Supports pagination (`limit`, `offset`)
   - Supports platform filter (`platform=pinterest` or `platform=instagram`)

2. **POST `/api/search/from-scraped-image`** - Click to search
   - Takes a `scraped_image_id`
   - Searches PRODUCTS database using the scraped image
   - Returns matching products (not scraped images)

3. **POST `/api/search/image`** - Direct image search
   - Takes any image URL (including scraped image URLs)
   - Searches PRODUCTS database
   - Returns matching products

### ⚠️ What We Also Have (Optional/Internal Use)

**POST `/api/search/scraped-images`** - Search scraped images
- This searches OTHER scraped images (not products)
- Useful for internal analysis or finding similar scraped content
- **Not the primary use case per PDF requirements**

---

## Testing the Correct Flow

### Step 1: Get Scraped Images (Gallery View)

```bash
# Get all scraped images for gallery
curl http://localhost:3000/api/search/scraped-images?limit=50

# Get Pinterest images only
curl http://localhost:3000/api/search/scraped-images?platform=pinterest&limit=50

# Get Instagram images only
curl http://localhost:3000/api/search/scraped-images?platform=instagram&limit=50
```

**Response:**
```json
{
  "images": [
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
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

### Step 2: Click Scraped Image → Search Products

```bash
# Search products using scraped image ID
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

**Response:**
```json
{
  "query_analysis": {
    "detected_items": [],
    "extracted_from_image": {...},
    "source_scraped_image": {
      "id": 1,
      "caption": "...",
      "hashtags": ["streetwear"],
      "platform": "pinterest"
    }
  },
  "matches": [
    {
      "product_id": "NK-001",
      "name": "Nike Dunk Low",
      "title": "Nike Dunk Low Panda Black White Sneakers",
      "extracted_metadata": {...},
      "visual_score": 0.89,
      "combined_score": 0.86,
      "price": 110.00,
      "image_url": "...",
      "match_reasons": []
    }
  ],
  "total_results": 10
}
```

### Alternative: Use Scraped Image URL Directly

```bash
# Get scraped image URL first
SCRAPED_IMAGE_URL="https://i.pinimg.com/..."

# Search products using scraped image URL
curl -X POST http://localhost:3000/api/search/image \
  -H "Content-Type: application/json" \
  -d "{
    \"external_image_url\": \"$SCRAPED_IMAGE_URL\",
    \"top_k\": 10
  }"
```

---

## Frontend Integration Flow

```typescript
// 1. Load gallery of scraped images
const images = await fetch('/api/search/scraped-images?limit=50');

// 2. User clicks an image
const handleImageClick = async (scrapedImageId: number) => {
  // 3. Search products using scraped image
  const products = await fetch('/api/search/from-scraped-image', {
    method: 'POST',
    body: JSON.stringify({
      scraped_image_id: scrapedImageId,
      top_k: 10
    })
  });
  
  // 4. Display matching products
  displayProducts(products);
};
```

---

## Summary

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/search/scraped-images` | Gallery view | Scraped images |
| `POST /api/search/from-scraped-image` | Click to search | **PRODUCTS** |
| `POST /api/search/image` | Direct image search | **PRODUCTS** |
| `POST /api/search/scraped-images` | Internal use | Other scraped images |

**The key point**: Scraped images are used to **query** the product database, not to find other scraped images.


