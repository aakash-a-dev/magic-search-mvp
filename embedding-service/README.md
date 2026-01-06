# Embedding Service

ML service for generating visual and text embeddings using CLIP and sentence-transformers.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run service:**
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   
   Or use the run script:
   ```bash
   # Windows
   run.bat
   
   # Linux/Mac
   ./run.sh
   ```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness check

### Embeddings
- `POST /api/v1/embeddings/image` - Generate image embedding
- `POST /api/v1/embeddings/text` - Generate text embedding
- `POST /api/v1/embeddings/image/batch` - Batch image embeddings
- `POST /api/v1/embeddings/text/batch` - Batch text embeddings

### Metadata
- `POST /api/v1/metadata/extract` - Extract metadata from title/image

## Docker

```bash
docker-compose up embedding-service
```

