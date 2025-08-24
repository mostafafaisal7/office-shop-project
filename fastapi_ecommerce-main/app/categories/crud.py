from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.categories import models, schemas
from slugify import slugify
from typing import Optional


async def create_category(db: AsyncSession, category_in: schemas.CategoryCreate, created_by: int):
    category_data = category_in.model_dump(exclude_unset=False)
    
    if not category_data.get("slug"):
        category_data["slug"] = slugify(category_data["name"])
    
    category = models.Category(**category_data, created_by=created_by)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    # Load the category with children relationship
    result = await db.execute(
        select(models.Category)
        .options(selectinload(models.Category.children))
        .where(models.Category.id == category.id)
    )
    return result.scalar_one()


async def get_category(db: AsyncSession, category_id: int) -> Optional[models.Category]:
    result = await db.execute(
        select(models.Category)
        .options(selectinload(models.Category.children).selectinload(models.Category.children))
        .where(models.Category.id == category_id)
    )
    return result.scalar_one_or_none()


async def get_category_by_slug(db: AsyncSession, slug: str) -> Optional[models.Category]:
    result = await db.execute(
        select(models.Category)
        .options(selectinload(models.Category.children).selectinload(models.Category.children))
        .where(models.Category.slug == slug)
    )
    return result.scalar_one_or_none()


async def get_all_categories(db: AsyncSession):
    result = await db.execute(
        select(models.Category)
        .options(selectinload(models.Category.children).selectinload(models.Category.children))
    )
    return result.scalars().all()


async def update_category(
    db: AsyncSession,
    category_id: int,
    category_in: schemas.CategoryUpdate,
    updated_by: int
):
    category = await get_category(db, category_id)
    if not category:
        return None
    
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    category.updated_by = updated_by
    await db.commit()
    await db.refresh(category)
    
    # Load the updated category with children relationship
    result = await db.execute(
        select(models.Category)
        .options(selectinload(models.Category.children))
        .where(models.Category.id == category.id)
    )
    return result.scalar_one()


async def delete_category(db: AsyncSession, category_id: int):
    category = await get_category(db, category_id)
    if not category:
        return None
    
    await db.delete(category)
    await db.commit()
    return category
