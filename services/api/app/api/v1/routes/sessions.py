from fastapi import APIRouter, UploadFile, File, Form
from datetime import datetime, timedelta
import uuid
from typing import Optional
from app.core.errors import NotFoundError, ValidationError
from app.core.config import settings
from app.storage.provider import StorageService

router = APIRouter()
storage = StorageService()

# In-memory sessions (replace with database)
sessions: dict = {}
person_images: dict = {}


@router.post("")
async def create_session():
    session_id = str(uuid.uuid4())
    token = str(uuid.uuid4())
    now = datetime.utcnow()
    sessions[session_id] = {
        "id": session_id,
        "token": token,
        "status": "ACTIVE",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=settings.SESSION_EXPIRY_MINUTES)).isoformat(),
    }
    return sessions[session_id]


@router.get("/{session_id}")
async def get_session(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise NotFoundError("Session", session_id)
    return session


@router.post("/{session_id}/person-images")
async def upload_person_image(
    session_id: str,
    image: UploadFile = File(...),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
):
    if session_id not in sessions:
        raise NotFoundError("Session", session_id)

    # Validate file type
    allowed_types = settings.get_allowed_image_types()
    if image.content_type not in allowed_types:
        raise ValidationError(f"Unsupported image type: {image.content_type}")

    # Read file
    data = await image.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_size:
        raise ValidationError(f"Image too large. Max: {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Save to storage
    image_id = str(uuid.uuid4())
    key = await storage.save_person_image(session_id, image_id, data)

    person_image = {
        "id": image_id,
        "session_id": session_id,
        "storage_key": key,
        "content_type": image.content_type,
        "file_size": len(data),
        "width": width or 0,
        "height": height or 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    person_images[image_id] = person_image

    return person_image


@router.get("/{session_id}/person-images/{image_id}")
async def get_person_image(session_id: str, image_id: str):
    img = person_images.get(image_id)
    if not img or img["session_id"] != session_id:
        raise NotFoundError("PersonImage", image_id)
    return img
