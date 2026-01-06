from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/vibe_search"
    REDIS_URL: str = "redis://localhost:6379"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"
    
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    TEXT_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    
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

