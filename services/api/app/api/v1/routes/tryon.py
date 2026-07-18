from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import asyncio
from typing import Optional
from app.core.errors import NotFoundError, ValidationError
from app.core.config import settings
from app.inference.engine import TryOnEngineRouter, TryOnInput

router = APIRouter()
engine_router = TryOnEngineRouter()

# In-memory jobs (replace with database)
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

    # Start background processing
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


async def process_try_on_job(job_id: str):
    job = try_on_jobs.get(job_id)
    if not job:
        return

    try:
        job["status"] = "PROCESSING"
        job["started_at"] = datetime.utcnow().isoformat()

        # Process via engine router
        engine = engine_router.get_engine()
        input_data = TryOnInput(
            person_image_path=f"session://{job['session_id']}/{job['person_image_id']}",
            garment_image_path=f"product://{job['product_id']}",
            category="UPPER_BODY",
            session_id=job["session_id"],
        )
        output = await engine.execute(input_data)

        # Store result
        result_id = str(uuid.uuid4())
        result = {
            "id": result_id,
            "job_id": job_id,
            "engine_name": output.engine_name,
            "engine_version": output.engine_version,
            "processing_time_ms": output.processing_time_ms,
            "result_path": output.result_path,
            "created_at": datetime.utcnow().isoformat(),
        }
        try_on_results[job_id] = result

        job["status"] = "SUCCEEDED"
        job["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        job["status"] = "FAILED"
        job["error_code"] = "INFERENCE_FAILED"
        job["error_message"] = str(e)
        job["completed_at"] = datetime.utcnow().isoformat()
