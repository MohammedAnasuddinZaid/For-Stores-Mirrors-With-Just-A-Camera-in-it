from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
import uuid
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models.product import Product, ProductCategory, ProductStatus
from app.api.v1.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.errors import NotFoundError, ValidationError, ConflictError
from app.storage.provider import StorageService

router = APIRouter()
storage = StorageService()


@router.get("", response_model=dict)
async def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product)

    if category:
        query = query.where(Product.category == category.upper())
    if status:
        query = query.where(Product.status == status.upper())
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.brand.ilike(search_term),
                Product.sku.ilike(search_term),
            )
        )

    query = query.order_by(Product.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()

    return {
        "items": [ProductResponse.model_validate(p).model_dump(mode="json") for p in products],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", product_id)
    return product


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    if data.sku:
        existing = await db.execute(select(Product).where(Product.sku == data.sku))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Product with SKU '{data.sku}' already exists")

    product = Product(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        category=data.category.value if hasattr(data.category, 'value') else data.category,
        brand=data.brand,
        sku=data.sku,
        price=data.price,
        currency=data.currency,
        status=data.status.value if hasattr(data.status, 'value') else ProductStatus.DRAFT,
        try_on_enabled=str(data.try_on_enabled).lower(),
        image_url="",
        thumbnail_url="",
    )
    if product.status == ProductStatus.PUBLISHED.value:
        product.published_at = datetime.now(timezone.utc)

    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", product_id)

    update_data = data.model_dump(exclude_unset=True)

    if "sku" in update_data and update_data["sku"]:
        existing = await db.execute(
            select(Product).where(Product.sku == update_data["sku"], Product.id != product_id)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"SKU '{update_data['sku']}' is already in use")

    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = (
            update_data["category"].value if hasattr(update_data["category"], "value") else update_data["category"]
        )
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = (
            update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        )
        if update_data["status"] == ProductStatus.PUBLISHED.value and product.status != ProductStatus.PUBLISHED.value:
            update_data["published_at"] = datetime.now(timezone.utc)
    if "try_on_enabled" in update_data:
        update_data["try_on_enabled"] = str(update_data["try_on_enabled"]).lower()

    for key, value in update_data.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", product_id)

    await db.delete(product)
    await db.commit()
    return {"deleted": True, "id": product_id}


@router.post("/{product_id}/images", response_model=ProductResponse)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", product_id)

    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise ValidationError(f"Unsupported type: {file.content_type}. Use JPEG, PNG, or WebP.")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise ValidationError("Image too large. Max 10MB.")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    key = await storage.save_product_image(product_id, filename, data)

    product.image_url = key
    product.thumbnail_url = key.replace(f".{ext}", f"_thumb.{ext}")
    await db.commit()
    await db.refresh(product)
    return product
