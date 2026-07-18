from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    # Application
    APPLICATION_ENV: str = "development"
    APP_NAME: str = "VirtualTryOn"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

    # D: Drive Data Root
    DATA_ROOT: str = "D:\\VirtualTryOn"
    MODEL_DIR: str = ""
    MODEL_CACHE_DIR: str = ""
    GARMENT_ASSET_DIR: str = ""
    UPLOAD_DIR: str = ""
    RESULT_DIR: str = ""
    TEMP_DIR: str = ""
    LOG_DIR: str = ""

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"

    # AI / Model
    AI_ENGINE: str = "mock"
    AI_MODEL: str = "ootdiffusion"
    AI_DEVICE: str = "cpu"
    HUGGINGFACE_TOKEN: str = ""
    HUGGINGFACE_SPACE: str = ""
    REPLICATE_API_TOKEN: str = ""

    # Storage
    STORAGE_PROVIDER: str = "local"

    # Session
    SESSION_EXPIRY_MINUTES: int = 30
    SESSION_CLEANUP_INTERVAL_MINUTES: int = 60

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"

    # Try-On
    MAX_TRY_ON_RETRIES: int = 3
    TRY_ON_TIMEOUT_SECONDS: int = 120

    model_config = {"env_file": ".env", "extra": "ignore"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set default D: drive paths
        root = self.DATA_ROOT
        self.MODEL_DIR = self.MODEL_DIR or os.path.join(root, "models")
        self.MODEL_CACHE_DIR = self.MODEL_CACHE_DIR or os.path.join(root, "model_cache")
        self.GARMENT_ASSET_DIR = self.GARMENT_ASSET_DIR or os.path.join(root, "garment_assets")
        self.UPLOAD_DIR = self.UPLOAD_DIR or os.path.join(root, "user_uploads")
        self.RESULT_DIR = self.RESULT_DIR or os.path.join(root, "generated_results")
        self.TEMP_DIR = self.TEMP_DIR or os.path.join(root, "temporary")
        self.LOG_DIR = self.LOG_DIR or os.path.join(root, "logs")

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.API_CORS_ORIGINS.split(",")]

    def get_allowed_image_types(self) -> list[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    @property
    def database_path(self) -> str:
        url = self.DATABASE_URL
        # Default: store on D: drive
        if url == "sqlite+aiosqlite:///./data/app.db":
            db_dir = os.path.join(self.DATA_ROOT, "database")
            os.makedirs(db_dir, exist_ok=True)
            return f"sqlite+aiosqlite:///{os.path.join(db_dir, 'app.db')}"
        # Convert sync sqlite to async
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url


settings = Settings()
