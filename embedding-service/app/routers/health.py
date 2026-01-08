from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.services.model_loader import ModelLoader

router = APIRouter()
model_loader = ModelLoader()

@router.get("/")
@router.head("/")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": model_loader._loaded
    }

@router.get("/ready")
@router.head("/ready")
async def readiness_check():
    if not model_loader._loaded:
        return JSONResponse(
            content={"status": "not_ready", "reason": "models_not_loaded"},
            status_code=503
        )
    return {"status": "ready"}






