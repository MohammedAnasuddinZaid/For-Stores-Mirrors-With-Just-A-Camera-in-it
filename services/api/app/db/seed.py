from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.models.product import Product, ProductCategory, ProductStatus
from app.db.session import async_session
import uuid
from datetime import datetime, timezone


SEED_PRODUCTS = [
    {"name": "Classic Blazer", "category": ProductCategory.UPPER_BODY, "brand": "Elegance", "price": 149.0, "sku": "BLZ-001", "status": ProductStatus.PUBLISHED},
    {"name": "Summer Dress", "category": ProductCategory.DRESS, "brand": "Chic", "price": 89.0, "sku": "DRS-001", "status": ProductStatus.PUBLISHED},
    {"name": "Denim Jacket", "category": ProductCategory.UPPER_BODY, "brand": "CasualWear", "price": 129.0, "sku": "JCK-001", "status": ProductStatus.PUBLISHED},
    {"name": "Casual Shirt", "category": ProductCategory.UPPER_BODY, "brand": "CottonCo", "price": 59.0, "sku": "SHT-001", "status": ProductStatus.PUBLISHED},
    {"name": "Wide Leg Pants", "category": ProductCategory.LOWER_BODY, "brand": "StylePlus", "price": 79.0, "sku": "PNT-001", "status": ProductStatus.PUBLISHED},
    {"name": "Aviator Sunglasses", "category": ProductCategory.GLASSES, "brand": "SunglassCo", "price": 199.0, "sku": "GLS-001", "status": ProductStatus.PUBLISHED},
    {"name": "Baseball Cap", "category": ProductCategory.HAT, "brand": "SportyGear", "price": 35.0, "sku": "HAT-001", "status": ProductStatus.PUBLISHED},
    {"name": "Leather Tote", "category": ProductCategory.OTHER, "brand": "Luxe", "price": 249.0, "sku": "BAG-001", "status": ProductStatus.PUBLISHED},
    {"name": "Silk Blouse", "category": ProductCategory.UPPER_BODY, "brand": "Elegance", "price": 119.0, "sku": "BLS-001", "status": ProductStatus.DRAFT},
    {"name": "Cargo Pants", "category": ProductCategory.LOWER_BODY, "brand": "CasualWear", "price": 69.0, "sku": "PNT-002", "status": ProductStatus.PUBLISHED},
    {"name": "Gold Hoops", "category": ProductCategory.JEWELRY, "brand": "Luxe", "price": 45.0, "sku": "JWL-001", "status": ProductStatus.PUBLISHED},
    {"name": "Running Shoes", "category": ProductCategory.SHOES, "brand": "SportyGear", "price": 159.0, "sku": "SHO-001", "status": ProductStatus.PUBLISHED},
    {"name": "SPECS27_52 Front", "category": ProductCategory.GLASSES, "brand": "SpecsCo", "price": 129.0, "sku": "GLS-002", "status": ProductStatus.PUBLISHED},
]


async def seed_database():
    async with async_session() as db:
        result = await db.execute(select(func.count()).select_from(Product))
        count = result.scalar() or 0
        if count > 0:
            return  # Already seeded

        for item in SEED_PRODUCTS:
            product = Product(
                id=str(uuid.uuid4()),
                name=item["name"],
                description=f"Premium {item['category'].value.lower().replace('_', ' ')} by {item['brand']}",
                category=item["category"].value,
                brand=item["brand"],
                sku=item["sku"],
                price=item["price"],
                currency="USD",
                status=item["status"].value,
                try_on_enabled="true",
                image_url=f"https://placehold.co/800x1000/3b82f6/ffffff?text={item['name'].replace(' ', '+')}",
                thumbnail_url=f"https://placehold.co/400x500/3b82f6/ffffff?text={item['name'].replace(' ', '+')}",
                published_at=datetime.now(timezone.utc) if item["status"] == ProductStatus.PUBLISHED else None,
            )
            db.add(product)

        await db.commit()
