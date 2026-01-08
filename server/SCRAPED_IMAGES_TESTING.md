# Testing Scraped Images Search

## Prerequisites

1. **Scraped images must have embeddings**:
   ```bash
   cd server
   npm run process:images
   ```
   This should show: `Success: 110, Failed: 0`

2. **Verify scraped images in database**:
   ```bash
   npm run db:studio
   ```
   Check `scraped_images` table - should have 110+ images with embeddings

---

## Scraped Images Search Endpoint

### POST `/api/search/scraped-images`

**Search by Image:**
```json
{
  "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "top_k": 10,
  "platform": "pinterest"
}
```

**Search by Text:**
```json
{
  "query": "streetwear outfit",
  "top_k": 10,
  "platform": "pinterest"
}
```

**Search All Platforms:**
```json
{
  "query": "fashion",
  "top_k": 20
}
```

---

## Test Commands

### PowerShell
```powershell
# Search scraped images by image
$body = @{
    image_url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    top_k = 10
    platform = "pinterest"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/search/scraped-images" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5

# Search scraped images by text
$body = @{
    query = "streetwear"
    top_k = 10
    platform = "pinterest"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/search/scraped-images" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### curl
```bash
# Search by image
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 10,
    "platform": "pinterest"
  }'

# Search by text
curl -X POST http://localhost:3000/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "query": "streetwear",
    "top_k": 10,
    "platform": "pinterest"
  }'
```

---

## Expected Results

With 110 scraped images:
- **Image search**: Should return 10 most visually similar scraped images
- **Text search**: Should return scraped images matching the query (if captions/hashtags exist)
- **Similarity scores**: Range from 0.0 to 1.0 (higher = more similar)

---

## Response Format

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

---

## Testing Checklist

- [ ] Scraped images have embeddings (check Prisma Studio)
- [ ] Image search returns similar scraped images
- [ ] Text search returns relevant scraped images
- [ ] Platform filter works (pinterest/instagram)
- [ ] Similarity scores are reasonable (0.5-1.0 for good matches)



