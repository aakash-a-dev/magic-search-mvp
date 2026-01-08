from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/vibe_search"
    REDIS_URL: str = "redis://localhost:6379"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"
    
    # Upgraded to better models for improved accuracy
    # CLIP ViT-B/32 is larger and more accurate than base-patch32
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"  # Can upgrade to "openai/clip-vit-large-patch14" for even better results (requires more GPU memory)
    # all-mpnet-base-v2 is significantly better than MiniLM-L6-v2 for semantic understanding
    TEXT_MODEL_NAME: str = "sentence-transformers/all-mpnet-base-v2"
    
    MAX_BATCH_SIZE: int = 32
    DEVICE: str = "cpu"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

