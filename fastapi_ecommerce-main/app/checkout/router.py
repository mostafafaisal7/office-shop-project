# checkout/router.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.checkout.schemas import CheckoutRequest, CheckoutResponse
from app.checkout.service import process_checkout
from app.core.database import get_db

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
async def checkout(data: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    return await process_checkout(data, db)
