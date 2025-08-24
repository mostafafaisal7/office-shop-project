from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from . import models, schemas

async def create_payment_method(db: AsyncSession, data: schemas.PaymentMethodCreate):
    method = models.PaymentMethod(**data.model_dump())
    db.add(method)
    await db.commit()
    await db.refresh(method)
    return method

async def get_all_payment_methods(db: AsyncSession):
    result = await db.execute(select(models.PaymentMethod).order_by(models.PaymentMethod.id))
    return result.scalars().all()

async def get_payment_method_by_id(db: AsyncSession, method_id: int):
    result = await db.execute(select(models.PaymentMethod).where(models.PaymentMethod.id == method_id))
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return method

async def update_payment_method(db: AsyncSession, method_id: int, data: schemas.PaymentMethodUpdate):
    method = await get_payment_method_by_id(db, method_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(method, field, value)
    
    await db.commit()
    await db.refresh(method)
    return method

async def delete_payment_method(db: AsyncSession, method_id: int):
    method = await get_payment_method_by_id(db, method_id)
    await db.delete(method)
    await db.commit()
    return {"message": "Payment method deleted successfully"}
