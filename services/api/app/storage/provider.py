from pathlib import Path
import os
import shutil
from typing import Protocol, AsyncIterator
from app.core.config import settings


class StorageProvider(Protocol):
    async def save(self, data: bytes, key: str, content_type: str) -> str: ...
    async def get(self, key: str) -> bytes | None: ...
    async def delete(self, key: str) -> bool: ...
    async def exists(self, key: str) -> bool: ...
    async def list_keys(self, prefix: str) -> list[str]: ...


class LocalFileSystemStorage:
    def __init__(self, base_path: str | None = None):
        self.base_path = Path(base_path or settings.GARMENT_ASSET_DIR)
        os.makedirs(self.base_path, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        # Prevent path traversal
        clean_key = key.replace("..", "").lstrip("/").lstrip("\\")
        full_path = (self.base_path / clean_key).resolve()
        if not str(full_path).startswith(str(self.base_path.resolve())):
            raise ValueError("Path traversal detected")
        os.makedirs(full_path.parent, exist_ok=True)
        return full_path

    async def save(self, data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        path = self._resolve_path(key)
        with open(path, "wb") as f:
            f.write(data)
        return key

    async def get(self, key: str) -> bytes | None:
        path = self._resolve_path(key)
        if not path.exists():
            return None
        with open(path, "rb") as f:
            return f.read()

    async def delete(self, key: str) -> bool:
        path = self._resolve_path(key)
        if not path.exists():
            return False
        if path.is_file():
            path.unlink()
        else:
            shutil.rmtree(path)
        return True

    async def exists(self, key: str) -> bool:
        path = self._resolve_path(key)
        return path.exists()

    async def list_keys(self, prefix: str) -> list[str]:
        path = self._resolve_path(prefix)
        if not path.exists() or not path.is_dir():
            return []
        return [
            str(p.relative_to(self.base_path)).replace("\\", "/")
            for p in path.rglob("*")
            if p.is_file()
        ]


class StorageService:
    _instance: "StorageService | None" = None
    _provider: LocalFileSystemStorage | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._provider = LocalFileSystemStorage()
        return cls._instance

    @property
    def provider(self) -> LocalFileSystemStorage:
        if self._provider is None:
            self._provider = LocalFileSystemStorage()
        return self._provider

    async def save_product_image(self, product_id: str, filename: str, data: bytes) -> str:
        key = f"products/{product_id}/{filename}"
        return await self.provider.save(data, key, "image/jpeg")

    async def save_person_image(self, session_id: str, image_id: str, data: bytes) -> str:
        key = f"sessions/{session_id}/person_images/{image_id}.jpg"
        return await self.provider.save(data, key, "image/jpeg")

    async def save_result_image(self, job_id: str, data: bytes) -> str:
        key = f"results/{job_id}/output.jpg"
        return await self.provider.save(data, key, "image/jpeg")

    async def get_image(self, key: str) -> bytes | None:
        return await self.provider.get(key)

    async def delete_image(self, key: str) -> bool:
        return await self.provider.delete(key)
