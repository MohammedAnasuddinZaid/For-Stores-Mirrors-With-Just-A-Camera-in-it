from typing import Protocol, Any
from dataclasses import dataclass
import asyncio
import os
import time
import math
from PIL import Image, ImageFilter
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
        await asyncio.sleep(0.3)
        self.initialized = True

    def _composite_garment(
        self, person_path: str, garment_path: str, category: str
    ) -> Image.Image:
        person = Image.open(person_path).convert("RGBA")
        garment = Image.open(garment_path).convert("RGBA")

        pw, ph = person.size

        if category in ("UPPER_BODY", "UPPER_BODY"):
            target_w = int(pw * 0.72)
            target_h = int(ph * 0.38)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.14)
        elif category in ("LOWER_BODY", "LOWER_BODY"):
            target_w = int(pw * 0.6)
            target_h = int(ph * 0.38)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.52)
        elif category in ("DRESS", "FULL_BODY"):
            target_w = int(pw * 0.65)
            target_h = int(ph * 0.68)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.1)
        elif category in ("GLASSES",):
            target_w = int(pw * 0.42)
            target_h = int(ph * 0.14)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.2)
        elif category in ("HAT",):
            target_w = int(pw * 0.5)
            target_h = int(ph * 0.2)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.04)
        elif category in ("JEWELRY",):
            target_w = int(pw * 0.3)
            target_h = int(ph * 0.12)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.12)
        elif category in ("SHOES",):
            target_w = int(pw * 0.5)
            target_h = int(ph * 0.15)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.82)
        else:
            target_w = int(pw * 0.7)
            target_h = int(ph * 0.5)
            resized = garment.resize((target_w, target_h), Image.LANCZOS)
            pos_x = (pw - target_w) // 2
            pos_y = int(ph * 0.25)

        overlay = Image.new("RGBA", person.size, (0, 0, 0, 0))
        overlay.paste(resized, (pos_x, pos_y), resized)

        blended = Image.alpha_composite(person, overlay)

        blurred = blended.filter(ImageFilter.GaussianBlur(radius=1.5))
        result = Image.composite(blended, person, overlay.split()[3])
        mask = overlay.split()[3].point(lambda x: min(255, int(x * 0.85)))
        result = Image.composite(result, person, mask)
        result = result.convert("RGB")

        return result

    async def execute(self, input_data: TryOnInput) -> TryOnOutput:
        if not self.initialized:
            await self.initialize()

        start = time.time()

        person_exists = os.path.isfile(input_data.person_image_path)
        garment_exists = os.path.isfile(input_data.garment_image_path)

        output_dir = os.path.join(settings.RESULT_DIR, input_data.session_id)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "output.jpg")

        if not person_exists:
            raise FileNotFoundError(
                f"Person image not found: {input_data.person_image_path}"
            )

        if not garment_exists:
            result_img = Image.open(input_data.person_image_path).convert("RGB")
        else:
            try:
                result_img = self._composite_garment(
                    input_data.person_image_path,
                    input_data.garment_image_path,
                    input_data.category,
                )
            except Exception as e:
                result_img = Image.open(input_data.person_image_path).convert("RGB")

        result_img.save(output_path, "JPEG", quality=92)

        elapsed_ms = (time.time() - start) * 1000

        return TryOnOutput(
            result_path=output_path,
            engine_name="mock",
            engine_version="1.0.0",
            processing_time_ms=elapsed_ms,
            metadata={
                "category": input_data.category,
                "person_image": input_data.person_image_path,
                "garment_image": input_data.garment_image_path,
                "output_path": output_path,
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
        import base64

        person_bytes = open(input_data.person_image_path, "rb").read()
        garment_bytes = open(input_data.garment_image_path, "rb").read()

        if not self.space_id:
            raise ValueError("No Hugging Face Space configured")

        api_url = f"https://{self.space_id.replace('/', '-')}.hf.space/gradio_api/call/predict"

        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
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

            output_dir = os.path.join(settings.RESULT_DIR, input_data.session_id)
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, "output.jpg")

            return TryOnOutput(
                result_path=output_path,
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
    def __init__(self):
        self.mock_engine = MockTryOnEngine()
        self.hf_engine = HuggingFaceTryOnEngine()
        self._current_engine = settings.AI_ENGINE

    def get_engine(self, category: str = "") -> TryOnEngine:
        if category in ("GLASSES", "HAT", "JEWELRY"):
            return self.mock_engine

        if self._current_engine == "huggingface" and settings.HUGGINGFACE_SPACE:
            return self.hf_engine

        return self.mock_engine

    async def health_check(self) -> dict:
        engine = self.get_engine()
        return await engine.health_check()
