from sqlalchemy.ext.asyncio import AsyncSession
from . import crud, schemas

async def add_payment_method(db: AsyncSession, data: schemas.PaymentMethodCreate):
    return await crud.create_payment_method(db, data)

async def list_payment_methods(db: AsyncSession):
    return await crud.get_all_payment_methods(db)

async def get_payment_method(db: AsyncSession, method_id: int):
    return await crud.get_payment_method_by_id(db, method_id)

async def update_payment_method(db: AsyncSession, method_id: int, data: schemas.PaymentMethodUpdate):
    return await crud.update_payment_method(db, method_id, data)

async def delete_payment_method(db: AsyncSession, method_id: int):
    return await crud.delete_payment_method(db, method_id)
