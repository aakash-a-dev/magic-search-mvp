import torch
import numpy as np
from PIL import Image
from typing import List, Union
import httpx
import io
from app.services.model_loader import ModelLoader
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_loader: ModelLoader):
        self.model_loader = model_loader
    
    async def download_image(self, image_url: str) -> Image.Image:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content)).convert("RGB")
    
    async def generate_visual_embedding(self, image: Union[str, Image.Image]) -> np.ndarray:
        clip_model, clip_processor = self.model_loader.get_clip_model()
        
        if isinstance(image, str):
            image = await self.download_image(image)
        
        inputs = clip_processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.model_loader.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
            embedding = image_features.cpu().numpy()[0]
        
        return embedding / np.linalg.norm(embedding)
    
    async def generate_text_embedding(self, text: str) -> np.ndarray:
        text_model = self.model_loader.get_text_model()
        embedding = text_model.encode(text, normalize_embeddings=True)
        return embedding
    
    async def generate_batch_visual_embeddings(
        self, 
        images: List[Union[str, Image.Image]]
    ) -> List[np.ndarray]:
        clip_model, clip_processor = self.model_loader.get_clip_model()
        
        processed_images = []
        for img in images:
            if isinstance(img, str):
                img = await self.download_image(img)
            processed_images.append(img)
        
        inputs = clip_processor(images=processed_images, return_tensors="pt", padding=True)
        inputs = {k: v.to(self.model_loader.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
            embeddings = image_features.cpu().numpy()
        
        normalized = [emb / np.linalg.norm(emb) for emb in embeddings]
        return normalized
    
    async def generate_batch_text_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        text_model = self.model_loader.get_text_model()
        embeddings = text_model.encode(texts, normalize_embeddings=True, batch_size=32)
        return [emb for emb in embeddings]

