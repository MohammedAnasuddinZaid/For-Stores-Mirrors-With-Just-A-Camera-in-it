from sqlalchemy import Column, String, DateTime, Enum as SAEnum, Integer, Text, Float
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class PersonImageStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    READY = "READY"
    INVALID = "INVALID"


class TryOnJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    TIMED_OUT = "TIMED_OUT"
    CANCELLED = "CANCELLED"


class PersonImage(Base):
    __tablename__ = "person_images"

    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    content_type = Column(String, default="image/jpeg")
    file_size = Column(Integer, default=0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    status = Column(SAEnum(PersonImageStatus), default=PersonImageStatus.UPLOADED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class TryOnJob(Base):
    __tablename__ = "try_on_jobs"

    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    person_image_id = Column(String, nullable=False)
    status = Column(SAEnum(TryOnJobStatus), default=TryOnJobStatus.QUEUED)
    engine_name = Column(String, default="mock")
    engine_version = Column(String, default="1.0.0")
    error_code = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    request_metadata = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class TryOnResult(Base):
    __tablename__ = "try_on_results"

    id = Column(String, primary_key=True)
    job_id = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    content_type = Column(String, default="image/jpeg")
    file_size = Column(Integer, default=0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
