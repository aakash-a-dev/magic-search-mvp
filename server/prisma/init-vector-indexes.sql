-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector indexes for better search performance
-- Note: These need to be created manually as Prisma doesn't fully support pgvector yet

-- Index for product visual embeddings
CREATE INDEX IF NOT EXISTS product_visual_embeddings_embedding_idx 
ON product_visual_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for product text embeddings
CREATE INDEX IF NOT EXISTS product_text_embeddings_embedding_idx 
ON product_text_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for scraped image embeddings
CREATE INDEX IF NOT EXISTS scraped_image_embeddings_embedding_idx 
ON scraped_image_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

