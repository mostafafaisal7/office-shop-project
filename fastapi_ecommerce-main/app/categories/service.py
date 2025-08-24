from sqlalchemy.ext.asyncio import AsyncSession
from app.categories import crud, schemas
from app.common.schemas import CurrentUser


async def create_category(db: AsyncSession, category_in: schemas.CategoryCreate, current_user: CurrentUser):
    return await crud.create_category(db, category_in, created_by=current_user.id)


async def get_category(db: AsyncSession, category_id: int):
    return await crud.get_category(db, category_id)


async def get_category_by_slug(db: AsyncSession, slug: str):
    return await crud.get_category_by_slug(db, slug)


async def get_all_categories(db: AsyncSession):
    return await crud.get_all_categories(db)


async def update_category(db: AsyncSession, category_id: int, category_in: schemas.CategoryUpdate, current_user: CurrentUser):
    return await crud.update_category(db, category_id, category_in, updated_by=current_user.id)


async def delete_category(db: AsyncSession, category_id: int):
    return await crud.delete_category(db, category_id)
