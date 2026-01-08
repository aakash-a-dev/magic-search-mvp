from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import numpy as np
from app.services.embedding_service import EmbeddingService
from app.services.metadata_extractor import MetadataExtractor
from app.services.model_loader import ModelLoader

router = APIRouter()
model_loader = ModelLoader()
embedding_service = EmbeddingService(model_loader)
metadata_extractor = MetadataExtractor()

class ImageEmbeddingRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.image_url and not self.image_base64:
            raise ValueError("Either image_url or image_base64 must be provided")

class TextEmbeddingRequest(BaseModel):
    text: str

class BatchImageEmbeddingRequest(BaseModel):
    image_urls: List[HttpUrl]

class BatchTextEmbeddingRequest(BaseModel):
    texts: List[str]

class MetadataRequest(BaseModel):
    title: str
    image_url: Optional[HttpUrl] = None

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimension: int

class MetadataResponse(BaseModel):
    brand: Optional[str]
    category: Optional[str]
    colors: List[str]
    style: List[str]
    type: Optional[str]
    dominant_colors: Optional[List[List[int]]] = None

@router.post("/embeddings/image", response_model=EmbeddingResponse)
async def generate_image_embedding(request: ImageEmbeddingRequest):
    try:
        if request.image_base64:
            embedding = await embedding_service.generate_visual_embedding(request.image_base64)
        else:
            embedding = await embedding_service.generate_visual_embedding(str(request.image_url))
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

@router.post("/embeddings/text", response_model=EmbeddingResponse)
async def generate_text_embedding(request: TextEmbeddingRequest):
    try:
        embedding = await embedding_service.generate_text_embedding(request.text)
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

@router.post("/embeddings/image/batch", response_model=List[EmbeddingResponse])
async def generate_batch_image_embeddings(request: BatchImageEmbeddingRequest):
    try:
        image_urls = [str(url) for url in request.image_urls]
        embeddings = await embedding_service.generate_batch_visual_embeddings(image_urls)
        return [
            EmbeddingResponse(embedding=emb.tolist(), dimension=len(emb))
            for emb in embeddings
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

@router.post("/embeddings/text/batch", response_model=List[EmbeddingResponse])
async def generate_batch_text_embeddings(request: BatchTextEmbeddingRequest):
    try:
        embeddings = await embedding_service.generate_batch_text_embeddings(request.texts)
        return [
            EmbeddingResponse(embedding=emb.tolist(), dimension=len(emb))
            for emb in embeddings
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

@router.post("/metadata/extract", response_model=MetadataResponse)
async def extract_metadata(request: MetadataRequest):
    try:
        metadata = metadata_extractor.extract_from_title(request.title)
        
        dominant_colors = None
        if request.image_url:
            try:
                dominant_colors = await metadata_extractor.extract_dominant_colors(str(request.image_url))
            except Exception as e:
                pass
        
        return MetadataResponse(
            brand=metadata.get("brand"),
            category=metadata.get("category"),
            colors=metadata.get("colors", []),
            style=metadata.get("style", []),
            type=metadata.get("type"),
            dominant_colors=dominant_colors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract metadata: {str(e)}")




