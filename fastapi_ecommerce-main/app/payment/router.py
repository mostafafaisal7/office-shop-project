from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from . import schemas, service
from app.core.database import get_db

router = APIRouter()

@router.post("/methods", response_model=schemas.PaymentMethodOut)
async def create_payment_method(data: schemas.PaymentMethodCreate, db: AsyncSession = Depends(get_db)):
    return await service.add_payment_method(db, data)

@router.get("/methods", response_model=List[schemas.PaymentMethodOut])
async def get_payment_methods(db: AsyncSession = Depends(get_db)):
    return await service.list_payment_methods(db)

@router.get("/methods/{method_id}", response_model=schemas.PaymentMethodOut)
async def get_payment_method(method_id: int, db: AsyncSession = Depends(get_db)):
    return await service.get_payment_method(db, method_id)

@router.put("/methods/{method_id}", response_model=schemas.PaymentMethodOut)
async def update_payment_method(method_id: int, data: schemas.PaymentMethodUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_payment_method(db, method_id, data)

@router.delete("/methods/{method_id}", response_model=Dict[str, str])
async def delete_payment_method(method_id: int, db: AsyncSession = Depends(get_db)):
    return await service.delete_payment_method(db, method_id)
