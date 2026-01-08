-- Migration: Update product_text_embeddings to support 768 dimensions (all-mpnet-base-v2)
-- Run this migration before regenerating embeddings with the new model

-- Drop the existing index first (required before altering column)
DROP INDEX IF EXISTS product_text_embeddings_embedding_idx;

-- Alter the column to support 768 dimensions
-- Note: This will work even if the column already has data (PostgreSQL will handle it)
ALTER TABLE product_text_embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- Recreate the index with the new dimension
CREATE INDEX IF NOT EXISTS product_text_embeddings_embedding_idx 
ON product_text_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: After running this migration, you'll need to regenerate all text embeddings
-- using: npm run process:products

