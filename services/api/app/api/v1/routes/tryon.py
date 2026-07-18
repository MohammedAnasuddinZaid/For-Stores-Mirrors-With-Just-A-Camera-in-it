from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import asyncio
import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.errors import NotFoundError, ValidationError
from app.core.config import settings
from app.db.session import get_db
from app.db.models.product import Product
from app.inference.engine import TryOnEngineRouter, TryOnInput
from app.storage.provider import StorageService

router = APIRouter()
engine_router = TryOnEngineRouter()
storage = StorageService()

try_on_jobs: dict = {}
try_on_results: dict = {}

class CreateTryOnRequest(BaseModel):
    product_id: str
    person_image_id: str


@router.post("/sessions/{session_id}/try-ons")
async def create_try_on(session_id: str, request: CreateTryOnRequest):
    job_id = str(uuid.uuid4())
    now = datetime.utcnow()

    job = {
        "id": job_id,
        "session_id": session_id,
        "product_id": request.product_id,
        "person_image_id": request.person_image_id,
        "status": "QUEUED",
        "engine_name": settings.AI_ENGINE,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=1)).isoformat(),
    }
    try_on_jobs[job_id] = job

    asyncio.create_task(process_try_on_job(job_id))

    return job


@router.get("/try-ons")
async def list_try_on_jobs():
    jobs = list(try_on_jobs.values())
    jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)
    return jobs


@router.get("/try-ons/{job_id}")
async def get_try_on_job(job_id: str):
    job = try_on_jobs.get(job_id)
    if not job:
        raise NotFoundError("TryOnJob", job_id)

    response = dict(job)
    result = try_on_results.get(job_id)
    if result:
        response["result"] = result

    return response


@router.get("/try-ons/{job_id}/result")
async def get_try_on_result(job_id: str):
    result = try_on_results.get(job_id)
    if not result:
        job = try_on_jobs.get(job_id)
        if not job:
            raise NotFoundError("TryOnJob", job_id)
        if job["status"] != "SUCCEEDED":
            raise HTTPException(
                status_code=400,
                detail={"code": "JOB_NOT_COMPLETED", "message": f"Job status: {job['status']}"},
            )
        raise NotFoundError("TryOnResult", job_id)
    return result


@router.get("/results/{job_id}/image")
async def get_result_image(job_id: str):
    result = try_on_results.get(job_id)
    if not result:
        raise NotFoundError("Result", job_id)

    image_path = result.get("result_path", "")
    if not image_path or not os.path.isfile(image_path):
        raise NotFoundError("ResultImage", job_id)

    return FileResponse(image_path, media_type="image/jpeg")


@router.head("/results/{job_id}/image")
async def head_result_image(job_id: str):
    result = try_on_results.get(job_id)
    if not result:
        raise NotFoundError("Result", job_id)

    image_path = result.get("result_path", "")
    if not image_path or not os.path.isfile(image_path):
        raise NotFoundError("ResultImage", job_id)

    return FileResponse(image_path, media_type="image/jpeg")


async def process_try_on_job(job_id: str):
    job = try_on_jobs.get(job_id)
    if not job:
        return

    from app.db.session import async_session as AsyncSessionLocal
    from app.api.v1.routes.sessions import person_images as sessions_person_images

    try:
        job["status"] = "PROCESSING"
        job["started_at"] = datetime.utcnow().isoformat()

        person_image_id = job["person_image_id"]
        product_id = job["product_id"]
        session_id = job["session_id"]

        person_img_record = sessions_person_images.get(person_image_id)
        if not person_img_record:
            raise ValueError(f"Person image {person_image_id} not found")

        storage_key = person_img_record.get("storage_key", "")
        person_image_path = os.path.join(
            settings.GARMENT_ASSET_DIR, storage_key.replace("\\", "/")
        )

        if not os.path.isfile(person_image_path):
            alt_path = os.path.join(settings.UPLOAD_DIR, storage_key.replace("\\", "/"))
            if os.path.isfile(alt_path):
                person_image_path = alt_path

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Product).where(Product.id == product_id))
            product = result.scalar_one_or_none()

        if not product:
            raise ValueError(f"Product {product_id} not found")

        category = product.category or "UPPER_BODY"
        garment_key = product.image_url or ""
        garment_image_path = ""
        if garment_key:
            garment_image_path = os.path.join(
                settings.GARMENT_ASSET_DIR, garment_key.replace("\\", "/")
            )
            alt_garment = os.path.join(settings.UPLOAD_DIR, garment_key.replace("\\", "/"))
            if os.path.isfile(alt_garment):
                garment_image_path = alt_garment
            elif not os.path.isfile(garment_image_path):
                garment_image_path = ""

        engine = engine_router.get_engine(category)
        input_data = TryOnInput(
            person_image_path=person_image_path,
            garment_image_path=garment_image_path,
            category=category,
            session_id=session_id,
            options={"product_id": product_id},
        )
        output = await engine.execute(input_data)

        result_id = str(uuid.uuid4())
        result_record = {
            "id": result_id,
            "job_id": job_id,
            "engine_name": output.engine_name,
            "engine_version": output.engine_version,
            "processing_time_ms": output.processing_time_ms,
            "result_path": output.result_path,
            "url": f"/api/results/{job_id}/image",
            "created_at": datetime.utcnow().isoformat(),
        }
        try_on_results[job_id] = result_record

        job["status"] = "SUCCEEDED"
        job["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        job["status"] = "FAILED"
        job["error_code"] = "INFERENCE_FAILED"
        job["error_message"] = str(e)
        job["completed_at"] = datetime.utcnow().isoformat()
