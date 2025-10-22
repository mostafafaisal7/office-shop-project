# app/orders/schemas.py

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
from app.common.enums import OrderStatus
from decimal import Decimal
from app.users.schemas import UserResponse


class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    variation_id: Optional[int] = None
    customization_option_id: Optional[int] = None
    customized_images: Optional[List[str]] = None
    quantity: int
    unit_price: float
    shipping_method_id: Optional[int] = None
    
    # Discount tracking fields (matching the database model)
    discount_rule_id: Optional[int] = None
    original_unit_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    discount_type: Optional[str] = None


class OrderItemRead(BaseModel):
    id: int  # now integer
    product_id: int
    product_name: str
    variation_id: Optional[int] = None
    customization_option_id: Optional[int] = None
    customized_images: Optional[List[str]] = None
    quantity: int
    unit_price: float
    shipping_method_id: Optional[int] = None
    
    # Discount tracking fields (matching the database model)
    discount_rule_id: Optional[int] = None
    original_unit_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    discount_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Enriched schemas for detailed responses with full related objects
class ShippingMethodDetail(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cost: float
    is_active: bool


class ShippingAddressDetail(BaseModel):
    id: str
    # full_name: str
    # phone: str
    # email: str
    # address_line: str
    # city: str
    # state: str
    # postal_code: str
    # country: str
    full_name: str
    phone: str
    email: str
    delivery_address: str
    district: str
    division: str
    postal_code: str
    country: str


class PaymentMethodDetail(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    type: str


class VariationMediaDetail(BaseModel):
    id: int
    file_path: str
    file_name: str
    media_type: str
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    design: bool = False
    area: str = "front"
    sort_order: int = 0
    uploaded_at: datetime


class VariationDetail(BaseModel):
    id: int
    product_id: int
    name: str
    sku: str
    price: Optional[Decimal] = None
    stock_quantity: int
    low_stock_threshold: int = 5
    attributes: Dict[str, Any] = {}
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime
    media: List[VariationMediaDetail] = []


class OrderItemDetailRead(BaseModel):
    # All basic fields
    id: int
    product_id: int
    product_name: str
    variation_id: Optional[int] = None
    customization_option_id: Optional[int] = None
    customized_images: Optional[List[str]] = None
    quantity: int
    unit_price: float
    shipping_method_id: Optional[int] = None

    # Discount tracking fields (matching the database model)
    discount_rule_id: Optional[int] = None
    original_unit_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    discount_type: Optional[str] = None

    # Enriched related objects (fetched via HTTP)
    shipping_method: Optional[ShippingMethodDetail] = None
    variation_details: Optional[VariationDetail] = None
    customization_details: Optional[dict] = None  # Full customization option data

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    guest_id: Optional[str] = None
    subtotal: float
    shipping_cost: Optional[float] = 0.0
    total_price: float
    shipping_method_id: Optional[int] = None
    estimated_delivery_days: Optional[int] = None
    shipping_cost_breakdown: Optional[dict] = None
    payment_method_id: Optional[int] = None
    shipping_address_id: Optional[str] = None
    items: List[OrderItemCreate]

    @model_validator(mode="after")
    def check_user_or_guest(self) -> "OrderCreate":
        if not self.user_id and not self.guest_id:
            raise ValueError("Either user_id or guest_id must be provided.")
        return self


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderTrackingUpdate(BaseModel):
    tracking_info: Optional[str]


class OrderTrackingSummary(BaseModel):
    order_id: str
    status: str
    tracking_info: Optional[str]
    created_at: datetime
    subtotal: float
    shipping_cost: Optional[float] = 0.0
    total_price: float
    estimated_delivery_days: Optional[int] = None


class OrderRead(BaseModel):
    id: str
    user_id: Optional[int]
    guest_id: Optional[str]
    subtotal: float
    shipping_cost: Optional[float] = 0.0
    total_price: float
    shipping_method_id: Optional[int] = None
    estimated_delivery_days: Optional[int] = None
    shipping_cost_breakdown: Optional[dict] = None
    payment_method_id: Optional[int] = None
    shipping_address_id: Optional[str] = None
    status: OrderStatus
    tracking_info: Optional[str]
    created_at: datetime
    items: List[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)


class OrderDetailRead(BaseModel):
    id: str
    user_id: Optional[int]
    guest_id: Optional[str]
    subtotal: float
    shipping_cost: Optional[float] = 0.0
    total_price: float
    shipping_method_id: Optional[int] = None
    estimated_delivery_days: Optional[int] = None
    shipping_cost_breakdown: Optional[dict] = None
    payment_method_id: Optional[int] = None
    shipping_address_id: Optional[str] = None
    status: OrderStatus
    tracking_info: Optional[str]
    created_at: datetime
    items: List[OrderItemDetailRead]  # Using enriched items
    
    # Enriched related objects (fetched via HTTP)
    payment_method: Optional[PaymentMethodDetail] = None
    shipping_method: Optional[ShippingMethodDetail] = None
    shipping_address: Optional[ShippingAddressDetail] = None

    model_config = ConfigDict(from_attributes=True)
    user: Optional[UserResponse] = None



# New lightweight schemas for the list endpoint
class OrderListItem(BaseModel):
    id: str
    user_id: Optional[int]
    guest_id: Optional[str]
    subtotal: float
    shipping_cost: Optional[float] = 0.0
    total_price: float
    status: OrderStatus
    created_at: datetime
    tracking_info: Optional[str]
    # No items field - this is the key difference for performance

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    orders: List[OrderListItem]
    total: int
    page: int
    per_page: int
    pages: int


class OrderUpdateRequest(BaseModel):
    shipping_method_id: Optional[int] = None
    shipping_address_id: Optional[str] = None
    payment_method_id: Optional[int] = None

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "OrderUpdateRequest":
        if not any([self.shipping_method_id, self.shipping_address_id, self.payment_method_id]):
            raise ValueError("At least one field must be provided for update.")
        return self


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = None


class OrderCancelResponse(BaseModel):
    id: str
    status: OrderStatus
    cancelled_at: datetime
    message: str
    
    model_config = ConfigDict(from_attributes=True)
