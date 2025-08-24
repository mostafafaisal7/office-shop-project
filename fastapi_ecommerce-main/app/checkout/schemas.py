# checkout/schemas.py

from typing import List, Optional
from pydantic import BaseModel

class CheckoutItem(BaseModel):
    cart_item_id: int
    product_id: int
    variation_id: Optional[int] = None
    quantity: int
    customization_option_id: Optional[int] = None
    customized_images: Optional[List[str]] = None

class CheckoutRequest(BaseModel):
    user_id: Optional[int] = None  # null for guest
    guest_id: Optional[str] = None
    items: List[CheckoutItem]
    shipping_method_id: Optional[int] = None
    shipping_address_id: str  # required
    payment_method_id: Optional[int] = None

class OrderSummary(BaseModel):
    subtotal: float
    shipping_cost: float
    total: float
    estimated_delivery_days: Optional[int] = None
    shipping_method_name: Optional[str] = None
    shipping_cost_breakdown: Optional[dict] = None
    
    # Discount information
    total_discount_amount: Optional[float] = 0.0
    items_with_discounts: Optional[int] = 0
    discount_breakdown: Optional[List[dict]] = None

class CheckoutResponse(BaseModel):
    order_id: str
    message: str
    order_summary: OrderSummary
