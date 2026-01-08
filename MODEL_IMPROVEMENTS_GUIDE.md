# Model Improvements Guide

## Overview
This guide explains the improvements made to enhance search result quality and how to apply them.

## Improvements Made

### 1. **Upgraded Text Embedding Model**
- **Before**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, smaller model)
- **After**: `sentence-transformers/all-mpnet-base-v2` (768 dimensions, significantly better semantic understanding)
- **Impact**: Better understanding of fashion terminology, synonyms, and context

### 2. **Enhanced Text Embeddings**
- **Before**: Only product title was embedded
- **After**: Enriched text includes:
  - Product title
  - Brand name
  - Category
  - Extracted metadata (colors, style, type)
- **Impact**: More comprehensive product representation for better matching

### 3. **Improved Query Expansion**
- Added fashion-specific synonym expansion
- Examples: "sneaker" → also searches for "shoe", "footwear", "trainer"
- **Impact**: Better handling of different terminology users might use

### 4. **Enhanced Scoring Algorithm**
- **Before**: Simple cosine similarity + title match bonus
- **After**: Multi-factor scoring with weighted components:
  - Semantic similarity (70% weight)
  - Title match bonus (15% weight)
  - Category match bonus (8% weight)
  - Brand match bonus (7% weight)
- **Impact**: More accurate relevance ranking

### 5. **Better Score Normalization**
- Scores are now clamped between 0 and 1
- Added minimum similarity threshold (0.3) for image search
- **Impact**: Filters out very low-quality matches

### 6. **Improved Image Search**
- Better score normalization
- Minimum similarity threshold to filter poor matches
- **Impact**: More relevant image search results

## How to Apply Improvements

### Step 1: Update Embedding Service Configuration
The configuration has been updated in `embedding-service/app/config.py`. The new model will be used automatically when the service restarts.

### Step 2: Update Database Schema (REQUIRED FIRST)
The database column is currently set to 384 dimensions, but the new model uses 768. You must update the database first:

```bash
# Navigate to server directory
cd server

# Run the migration to update the column dimensions
npm run migrate:text-embeddings
```

This will:
- Drop the old index
- Alter the column from `vector(384)` to `vector(768)`
- Recreate the index with the new dimensions

**Alternative**: If you prefer to run the SQL directly:
```bash
psql -d your_database_name -f prisma/migrations/update-text-embeddings-to-768.sql
```

### Step 3: Regenerate Embeddings (IMPORTANT)
After the migration, regenerate all product embeddings:

```bash
# Regenerate all product embeddings with the new model
npm run process:products
```

Or for a specific product:
```bash
npm run process:products <product-id>
```

Alternatively, you can use tsx directly:
```bash
npx tsx src/scripts/process-products.ts
# Or for a specific product:
npx tsx src/scripts/process-products.ts <product-id>
```

### Step 3: Restart Services
```bash
# Restart embedding service to load new model
cd embedding-service
# Stop current service, then restart
python -m uvicorn app.main:app --reload

# Restart server
cd ../server
npm run dev
```

## Model Performance Comparison

### Text Embedding Models
| Model | Dimensions | Speed | Quality | Best For |
|-------|-----------|-------|---------|----------|
| all-MiniLM-L6-v2 | 384 | Fast | Good | Quick searches, limited resources |
| **all-mpnet-base-v2** | 768 | Medium | **Excellent** | **Production, accuracy priority** |

### CLIP Models (Image Search)
| Model | Size | Quality | Memory | Best For |
|-------|------|---------|--------|----------|
| clip-vit-base-patch32 | Small | Good | Low | Current setup |
| clip-vit-large-patch14 | Large | Excellent | High | Maximum accuracy (optional upgrade) |

## Optional: Further Improvements

### Upgrade CLIP Model (Requires More GPU Memory)
If you have sufficient GPU memory, you can upgrade to a larger CLIP model:

1. Edit `embedding-service/app/config.py`:
```python
CLIP_MODEL_NAME: str = "openai/clip-vit-large-patch14"  # Much better accuracy
```

2. Regenerate visual embeddings:
```bash
cd server
npm run process:products
```

### Fine-tuning (Advanced)
For even better results, consider fine-tuning the models on your specific fashion product dataset. This requires:
- Large labeled dataset
- GPU resources
- ML expertise

## Testing Improvements

After regenerating embeddings, test the improvements:

1. **Text Search**: Try queries like "sneaker", "athletic shoe", "trainer" - should all find similar results
2. **Image Search**: Upload product images - should see better relevance scores
3. **Hybrid Search**: Combine text and image - should see improved combined scoring

## Monitoring

Check search quality by:
- Reviewing similarity scores (should be higher for relevant matches)
- Testing edge cases (synonyms, related terms)
- Comparing before/after results

## Troubleshooting

### Low Similarity Scores
- Ensure embeddings were regenerated with new model
- Check that products have valid image URLs
- Verify metadata extraction is working

### Slow Performance
- The new text model is larger (768 vs 384 dimensions)
- Consider using GPU if available
- Batch processing is recommended for large datasets

### Memory Issues
- If using larger CLIP model, ensure sufficient GPU memory
- Consider using CPU with smaller batch sizes
- Monitor memory usage during embedding generation

## Next Steps

1. ✅ Models upgraded
2. ✅ Search algorithm improved
3. ⏳ **Regenerate embeddings** (required)
4. ⏳ Test and validate improvements
5. ⏳ Monitor production performance

---

**Note**: The improvements are backward compatible. Old embeddings will still work, but regenerating with the new model will provide significantly better results.

