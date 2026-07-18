from fastapi import APIRouter
from app.api.v1.routes import health, products, sessions, tryon

router = APIRouter(prefix="/api/v1")


@router.get("")
async def api_root():
    return {
        "service": "Virtual Try-On API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "products": "/api/v1/products",
            "sessions": "/api/v1/sessions",
            "try-ons": "/api/v1/try-ons",
            "docs": "/docs",
        },
    }


router.include_router(health.router, tags=["health"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(tryon.router, prefix="", tags=["try-on"])
