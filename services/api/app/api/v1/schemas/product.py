from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.models.product import ProductCategory, ProductStatus


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    category: ProductCategory
    brand: str = ""
    sku: Optional[str] = None
    price: float = 0.0
    currency: str = "USD"
    status: ProductStatus = ProductStatus.DRAFT
    try_on_enabled: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[ProductStatus] = None
    try_on_enabled: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    brand: str
    sku: Optional[str]
    price: float
    currency: str
    status: str
    image_url: str
    thumbnail_url: str
    try_on_enabled: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    published_at: Optional[datetime]

    model_config = {"from_attributes": True}
