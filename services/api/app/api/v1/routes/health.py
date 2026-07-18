from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APPLICATION_ENV,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "storage": {"available": True},
    }
