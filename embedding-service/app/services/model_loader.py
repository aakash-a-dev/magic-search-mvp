import torch
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.clip_model = None
        self.clip_processor = None
        self.text_model = None
        self.device = torch.device(settings.DEVICE)
        self._loaded = False
        self._loading = False
        ModelLoader._initialized = True
    
    async def load_models(self):
        if self._loaded:
            return
        
        if self._loading:
            import asyncio
            while self._loading:
                await asyncio.sleep(0.1)
            return
        
        self._loading = True
        try:
            logger.info(f"Loading models on device: {self.device}")
            
            logger.info(f"Loading CLIP model: {settings.CLIP_MODEL_NAME}")
            try:
            self.clip_model = CLIPModel.from_pretrained(settings.CLIP_MODEL_NAME)
            self.clip_processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL_NAME)
            except (OSError, ValueError) as e:
                if "Consistency check failed" in str(e) or "force_download" in str(e):
                    logger.warning(f"Model files corrupted, forcing re-download: {e}")
                    logger.info("Re-downloading CLIP model with force_download=True")
                    self.clip_model = CLIPModel.from_pretrained(settings.CLIP_MODEL_NAME, force_download=True)
                    self.clip_processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL_NAME, force_download=True)
                else:
                    raise
            
            self.clip_model.to(self.device)
            self.clip_model.eval()
            
            logger.info(f"Loading text model: {settings.TEXT_MODEL_NAME}")
            try:
                self.text_model = SentenceTransformer(settings.TEXT_MODEL_NAME, device=str(self.device))
            except (OSError, ValueError) as e:
                if "Consistency check failed" in str(e) or "force_download" in str(e):
                    logger.warning(f"Text model files corrupted, forcing re-download: {e}")
                    logger.info("Re-downloading text model")
                    # SentenceTransformer doesn't have force_download, so we need to clear cache
                    import os
                    from pathlib import Path
                    cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
                    # Clear the specific model cache
                    model_cache = cache_dir / f"models--{settings.TEXT_MODEL_NAME.replace('/', '--')}"
                    if model_cache.exists():
                        logger.info(f"Clearing cache for {settings.TEXT_MODEL_NAME}")
                        import shutil
                        shutil.rmtree(model_cache, ignore_errors=True)
            self.text_model = SentenceTransformer(settings.TEXT_MODEL_NAME, device=str(self.device))
                else:
                    raise
            
            self._loaded = True
            logger.info("All models loaded successfully")
        finally:
            self._loading = False
    
    async def unload_models(self):
        if not self._loaded:
            return
        
        logger.info("Unloading models")
        del self.clip_model
        del self.clip_processor
        del self.text_model
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        self._loaded = False
    
    def get_clip_model(self):
        if not self._loaded:
            raise RuntimeError("Models not loaded")
        return self.clip_model, self.clip_processor
    
    def get_text_model(self):
        if not self._loaded:
            raise RuntimeError("Models not loaded")
        return self.text_model

