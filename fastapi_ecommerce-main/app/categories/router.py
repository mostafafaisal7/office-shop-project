from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.categories import schemas, service
from app.core.database import get_db
from app.common.dependencies import get_current_user, require_admin

router = APIRouter()


@router.post(
    "/", 
    response_model=schemas.CategoryOut, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)]
)
async def create_category(
    category_data: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new category (Admin only)"""
    return await service.create_category(db, category_data, current_user)


@router.get("/", response_model=List[schemas.CategoryOut])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories"""
    return await service.get_all_categories(db)


@router.get("/{category_id}", response_model=schemas.CategoryOut)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """Get a category by ID"""
    category = await service.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/slug/{slug}", response_model=schemas.CategoryOut)
async def get_category_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a category by slug"""
    category = await service.get_category_by_slug(db, slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put(
    "/{category_id}", 
    response_model=schemas.CategoryOut,
    dependencies=[Depends(require_admin)]
)
async def update_category(
    category_id: int,
    category_data: schemas.CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a category (Admin only)"""
    updated_category = await service.update_category(db, category_id, category_data, current_user)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category


@router.delete(
    "/{category_id}", 
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)]
)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a category (Admin only)"""
    result = await service.delete_category(db, category_id)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}
