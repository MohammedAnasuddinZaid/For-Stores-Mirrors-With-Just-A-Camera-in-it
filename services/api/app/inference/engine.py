from typing import Protocol, Any
from dataclasses import dataclass
import asyncio
import os
from app.core.config import settings


@dataclass
class TryOnInput:
    person_image_path: str
    garment_image_path: str
    category: str
    session_id: str
    options: dict | None = None


@dataclass
class TryOnOutput:
    result_path: str
    engine_name: str
    engine_version: str
    processing_time_ms: float
    metadata: dict | None = None


class TryOnEngine(Protocol):
    async def initialize(self) -> None: ...
    async def execute(self, input_data: TryOnInput) -> TryOnOutput: ...
    async def health_check(self) -> dict: ...
    async def dispose(self) -> None: ...


class MockTryOnEngine:
    def __init__(self):
        self.initialized = False

    async def initialize(self) -> None:
        await asyncio.sleep(0.5)
        self.initialized = True

    async def execute(self, input_data: TryOnInput) -> TryOnOutput:
        if not self.initialized:
            await self.initialize()

        # Simulate processing time
        processing_time = 2.0 + (hash(input_data.session_id) % 3)
        await asyncio.sleep(processing_time)

        return TryOnOutput(
            result_path=f"mock://results/{input_data.session_id}",
            engine_name="mock",
            engine_version="1.0.0",
            processing_time_ms=processing_time * 1000,
            metadata={
                "category": input_data.category,
                "simulated": True,
            },
        )

    async def health_check(self) -> dict:
        return {
            "engine": "mock",
            "status": "healthy",
            "initialized": self.initialized,
        }

    async def dispose(self) -> None:
        self.initialized = False


class HuggingFaceTryOnEngine:
    """Engine that calls Hugging Face Spaces for free inference"""

    def __init__(self, space_id: str | None = None, token: str | None = None):
        self.space_id = space_id or settings.HUGGINGFACE_SPACE or "levihsu/OOTDiffusion"
        self.token = token or settings.HUGGINGFACE_TOKEN
        self.initialized = False

    async def initialize(self) -> None:
        self.initialized = True

    async def execute(self, input_data: TryOnInput) -> TryOnOutput:
        if not self.initialized:
            await self.initialize()

        import httpx
        import json

        # Read images
        person_bytes = open(input_data.person_image_path, "rb").read()
        garment_bytes = open(input_data.garment_image_path, "rb").read()

        # Check if we have a space configured
        if not self.space_id:
            raise ValueError("No Hugging Face Space configured")

        # Call the Hugging Face Space API
        api_url = f"https://{self.space_id.replace('/', '-')}.hf.space/gradio_api/call/predict"
        
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            import base64
            person_b64 = base64.b64encode(person_bytes).decode()
            garment_b64 = base64.b64encode(garment_bytes).decode()

            payload = {
                "data": [
                    f"data:image/jpeg;base64,{person_b64}",
                    f"data:image/jpeg;base64,{garment_b64}",
                ]
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()

            return TryOnOutput(
                result_path=str(result),
                engine_name="huggingface",
                engine_version="1.0.0",
                processing_time_ms=0,
            )
        except Exception as e:
            raise RuntimeError(f"Hugging Face inference failed: {e}")

    async def health_check(self) -> dict:
        return {
            "engine": "huggingface",
            "space": self.space_id,
            "status": "healthy" if self.initialized else "not_initialized",
        }

    async def dispose(self) -> None:
        self.initialized = False


class TryOnEngineRouter:
    """Routes try-on requests to the appropriate engine based on category"""

    def __init__(self):
        self.mock_engine = MockTryOnEngine()
        self.hf_engine = HuggingFaceTryOnEngine()
        self._current_engine = settings.AI_ENGINE

    def get_engine(self, category: str = "") -> TryOnEngine:
        if category in ("GLASSES", "HAT", "JEWELRY"):
            # AR-based try-on is client-side; fall back to mock for API
            return self.mock_engine

        if self._current_engine == "huggingface" and settings.HUGGINGFACE_SPACE:
            return self.hf_engine

        return self.mock_engine

    async def health_check(self) -> dict:
        engine = self.get_engine()
        return await engine.health_check()
