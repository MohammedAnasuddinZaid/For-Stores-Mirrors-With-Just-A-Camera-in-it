from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class ProductCategory(str, enum.Enum):
    UPPER_BODY = "UPPER_BODY"
    LOWER_BODY = "LOWER_BODY"
    FULL_BODY = "FULL_BODY"
    DRESS = "DRESS"
    GLASSES = "GLASSES"
    HAT = "HAT"
    JEWELRY = "JEWELRY"
    SHOES = "SHOES"
    OTHER = "OTHER"


class ProductStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PROCESSING = "PROCESSING"
    READY = "READY"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    category = Column(SAEnum(ProductCategory), nullable=False)
    brand = Column(String, default="")
    sku = Column(String, unique=True, nullable=True)
    price = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    status = Column(SAEnum(ProductStatus), default=ProductStatus.DRAFT)
    image_url = Column(String, default="")
    thumbnail_url = Column(String, default="")
    try_on_enabled = Column(String, default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
