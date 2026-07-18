from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.core.config import settings
from app.api.v1.router import router as v1_router
from app.db.session import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(os.path.join(settings.DATA_ROOT, "database"), exist_ok=True)
    os.makedirs(settings.GARMENT_ASSET_DIR, exist_ok=True)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.RESULT_DIR, exist_ok=True)
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    os.makedirs(settings.LOG_DIR, exist_ok=True)
    
    await init_db()
    from app.db.seed import seed_database
    await seed_database()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI Virtual Try-On Platform API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(v1_router)


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }
