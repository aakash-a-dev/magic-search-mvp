from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from app.config import settings
from app.routers import embeddings, health
from app.services.model_loader import ModelLoader
from app.utils.logging import setup_logging

setup_logging()

model_loader = ModelLoader()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await model_loader.load_models()
    yield
    await model_loader.unload_models()

app = FastAPI(
    title="Embedding Service",
    description="ML service for generating visual and text embeddings",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["embeddings"])

@app.get("/")
async def root():
    return {"service": "embedding-service", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.LOG_LEVEL == "debug"
    )

