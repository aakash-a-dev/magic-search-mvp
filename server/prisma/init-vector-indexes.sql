-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector indexes for better search performance
-- Note: These need to be created manually as Prisma doesn't fully support pgvector yet
-- This script checks if tables exist before creating indexes

-- Index for product visual embeddings
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_visual_embeddings') THEN
        CREATE INDEX IF NOT EXISTS product_visual_embeddings_embedding_idx 
        ON product_visual_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- Index for product text embeddings
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_text_embeddings') THEN
        CREATE INDEX IF NOT EXISTS product_text_embeddings_embedding_idx 
        ON product_text_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- Index for scraped image embeddings
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scraped_image_embeddings') THEN
        CREATE INDEX IF NOT EXISTS scraped_image_embeddings_embedding_idx 
        ON scraped_image_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

