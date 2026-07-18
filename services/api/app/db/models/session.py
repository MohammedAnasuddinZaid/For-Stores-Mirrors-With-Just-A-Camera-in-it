from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CLOSED = "CLOSED"


class TryOnSession(Base):
    __tablename__ = "try_on_sessions"

    id = Column(String, primary_key=True)
    token = Column(String, unique=True, nullable=False)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.ACTIVE)
    device_metadata = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity_at = Column(DateTime(timezone=True), onupdate=func.now())
