from fastapi import APIRouter
from app.services.model_loader import ModelLoader

router = APIRouter()
model_loader = ModelLoader()

@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": model_loader._loaded
    }

@router.get("/ready")
async def readiness_check():
    if not model_loader._loaded:
        return {"status": "not_ready", "reason": "models_not_loaded"}, 503
    return {"status": "ready"}




