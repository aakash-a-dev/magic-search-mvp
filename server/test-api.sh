#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Testing Vibe Search API ===\n"

echo "1. Health Check"
curl -s $BASE_URL/health | jq .
echo "\n"

echo "2. Text Search - Basic"
curl -s -X POST $BASE_URL/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "beach shorts", "top_k": 5}' | jq .
echo "\n"

echo "3. Text Search - With Filters"
curl -s -X POST $BASE_URL/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 5,
    "filters": {
      "category": ["Footwear"],
      "brands": ["Nike"],
      "price_range": [50, 200]
    }
  }' | jq .
echo "\n"

echo "4. Image Search"
curl -s -X POST $BASE_URL/api/search/image \
  -H "Content-Type: application/json" \
  -d '{
    "external_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 5
  }' | jq .
echo "\n"

echo "5. Hybrid Search"
curl -s -X POST $BASE_URL/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sneakers",
    "top_k": 5
  }' | jq .
echo "\n"

echo "6. Scraped Images Search - By Image"
curl -s -X POST $BASE_URL/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "top_k": 5,
    "platform": "pinterest"
  }' | jq .
echo "\n"

echo "7. Scraped Images Search - By Text"
curl -s -X POST $BASE_URL/api/search/scraped-images \
  -H "Content-Type: application/json" \
  -d '{
    "query": "streetwear",
    "top_k": 5,
    "platform": "pinterest"
  }' | jq .
echo "\n"

echo "8. Get Scraped Images Gallery"
curl -s "$BASE_URL/api/search/scraped-images?limit=10" | jq .
echo "\n"

echo "9. Get Products"
curl -s "$BASE_URL/api/search/products?limit=10" | jq .
echo "\n"

echo "10. Get Unified Data (Scraped Images + Products Together)"
curl -s "$BASE_URL/api/search/unified?scraped_limit=10&products_limit=10" | jq .
echo "\n"

echo "11. Search Products from Scraped Image (Click to Search)"
curl -s -X POST $BASE_URL/api/search/from-scraped-image \
  -H "Content-Type: application/json" \
  -d '{
    "scraped_image_id": 1,
    "top_k": 5
  }' | jq .
echo "\n"

echo "=== Tests Complete ==="

