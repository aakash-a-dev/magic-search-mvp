# Text Search Explanation

## How Text Search Works

The `/api/search/text` endpoint searches **PRODUCTS**, not scraped images. This is correct behavior according to the PDF requirements.

### Why Only Products?

According to the PDF:
- **Scraped images** are used as **query sources** (users click them to search products)
- **Products** are the **search results** (what users want to find)

So when you search "beach shorts", you get:
- ✅ **Products** that match (e.g., "Patagonia Baggies Shorts", "Ralph Lauren Swim Trunks")
- ❌ **NOT** scraped images (scraped images are for browsing, not searching)

---

## How to Test Correctly

### 1. Ensure Products Have Embeddings

```bash
cd server
npm run process:products
```

**Expected output:**
```
Processing products...
Success: 60, Failed: 0
```

### 2. Test Text Search

```bash
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "beach shorts for summer vacation",
    "top_k": 10
  }'
```

**Expected Results:**
- Products with "shorts" in title (e.g., "Patagonia Baggies 5\" Shorts Blue")
- Products with "swim" in title (e.g., "Ralph Lauren Classic Fit Swim Trunks Navy")
- Products semantically similar to "beach", "summer", "vacation"

---

## What Gets Returned

The response includes:

```json
{
  "query_understanding": {
    "original_query": "beach shorts for summer vacation",
    "intent": "find beach shorts for summer vacation",
    "extracted_keywords": ["beach", "shorts", "for", "summer", "vacation"],
    "expanded_terms": [...]
  },
  "matches": [
    {
      "product_id": "PT-004",
      "title": "Patagonia Baggies 5\" Shorts Blue",
      "semantic_score": 0.85,
      "title_match_score": 0.15,
      "matched_terms": ["shorts"],
      "relevance_reasons": [
        "Title contains: shorts",
        "High semantic similarity: 85.0%"
      ]
    }
  ]
}
```

---

## If Results Are Incorrect

### Check 1: Do Products Have Text Embeddings?

```bash
# Check in Prisma Studio
npm run db:studio
```

Look at `product_text_embeddings` table - should have 60 rows.

### Check 2: Are Products Seeded?

```bash
# Re-seed if needed
npm run seed:products
```

### Check 3: Test with Simpler Query

```bash
# Try a simpler query
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "shorts", "top_k": 10}'
```

This should definitely return products with "shorts" in the title.

---

## Understanding the Search Algorithm

1. **Semantic Search**: Uses embeddings to find semantically similar products
   - "beach shorts" → finds "swim trunks", "board shorts", "summer shorts"

2. **Keyword Matching**: Boosts products with matching keywords in title
   - "shorts" in query → boosts products with "shorts" in title

3. **Combined Score**: `semantic_score + title_match_bonus`
   - Higher score = more relevant

---

## Common Issues

### Issue: "No results returned"
**Solution**: 
1. Check if products have embeddings: `npm run process:products`
2. Check if products exist: `npm run db:studio`

### Issue: "Wrong products returned"
**Solution**:
1. The search uses semantic similarity - it might return products that are semantically related but don't have exact keywords
2. Try adding filters:
```json
{
  "query": "beach shorts",
  "top_k": 10,
  "filters": {
    "category": ["Bottoms"]
  }
}
```

### Issue: "Scraped images not in results"
**Solution**: This is **correct behavior**. Scraped images are not returned in text search. They are:
- Displayed in gallery: `GET /api/search/scraped-images`
- Used to search products: `POST /api/search/from-scraped-image`

---

## Summary

✅ **Text search returns PRODUCTS** (correct)  
✅ **Scraped images are query sources**, not results  
✅ **Results are ranked by semantic similarity + keyword matching**  
✅ **Ensure products have embeddings** before testing  


