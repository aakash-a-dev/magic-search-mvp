import torch
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        self.clip_model = None
        self.clip_processor = None
        self.text_model = None
        self.device = torch.device(settings.DEVICE)
        self._loaded = False
    
    async def load_models(self):
        if self._loaded:
            return
        
        logger.info(f"Loading models on device: {self.device}")
        
        logger.info(f"Loading CLIP model: {settings.CLIP_MODEL_NAME}")
        self.clip_model = CLIPModel.from_pretrained(settings.CLIP_MODEL_NAME)
        self.clip_processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL_NAME)
        self.clip_model.to(self.device)
        self.clip_model.eval()
        
        logger.info(f"Loading text model: {settings.TEXT_MODEL_NAME}")
        self.text_model = SentenceTransformer(settings.TEXT_MODEL_NAME, device=str(self.device))
        
        self._loaded = True
        logger.info("All models loaded successfully")
    
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

