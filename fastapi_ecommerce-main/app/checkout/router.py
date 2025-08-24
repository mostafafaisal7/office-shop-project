# checkout/router.py

from fastapi import APIRouter
from app.checkout.schemas import CheckoutRequest, CheckoutResponse
from app.checkout.service import process_checkout

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
async def checkout(data: CheckoutRequest):
    return await process_checkout(data)
