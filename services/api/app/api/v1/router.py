from fastapi import APIRouter
from app.api.v1.routes import health, products, sessions, tryon

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["health"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(tryon.router, prefix="", tags=["try-on"])
