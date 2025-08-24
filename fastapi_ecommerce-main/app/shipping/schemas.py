from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer
from enum import Enum
from datetime import datetime

class AdjustmentType(str, Enum):
    PER_ITEM = "per_item"
    FLAT_RATE = "flat_rate"

class ShippingAddressCreate(BaseModel):
    user_id: Optional[int]
    guest_id: Optional[str]
    full_name: str
    phone: str
    email: str
    address_line: str
    city: str
    state: str
    postal_code: str
    country: str

class ShippingAddressOut(ShippingAddressCreate):
    id: str

    model_config = ConfigDict(from_attributes=True)

class ShippingMethodCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cost: float
    delivery_days: Optional[int] = None
    is_active: bool = True

class ShippingAddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

class ShippingMethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    delivery_days: Optional[int] = None
    is_active: Optional[bool] = None

class ShippingMethodOut(ShippingMethodCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Shipping Cost Rule Schemas
class ShippingCostRuleCreate(BaseModel):
    shipping_method_id: int
    min_quantity: int
    max_quantity: Optional[int] = None
    cost_adjustment: float
    adjustment_type: AdjustmentType = AdjustmentType.PER_ITEM
    is_active: bool = True


class ShippingCostRuleUpdate(BaseModel):
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None
    cost_adjustment: Optional[float] = None
    adjustment_type: Optional[AdjustmentType] = None
    is_active: Optional[bool] = None


class ShippingCostRuleOut(BaseModel):
    id: int
    shipping_method_id: int
    min_quantity: int
    max_quantity: Optional[int] = None
    cost_adjustment: float
    adjustment_type: AdjustmentType
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# Enhanced Shipping Method with Cost Rules
class ShippingMethodWithRulesOut(ShippingMethodOut):
    cost_rules: List[ShippingCostRuleOut] = []

    model_config = ConfigDict(from_attributes=True)


# Cost Calculation Schemas
class ShippingCostCalculationRequest(BaseModel):
    shipping_method_id: int
    total_quantity: int


class ShippingCostCalculationResponse(BaseModel):
    shipping_method_id: int
    base_cost: float
    total_quantity: int
    applied_rules: List[dict] = []
    final_cost: float
    delivery_days: Optional[int] = None


class ShippingCostPreviewResponse(BaseModel):
    shipping_method_id: int
    base_cost: float
    delivery_days: Optional[int] = None
    cost_breakdown: List[dict] = []  # Different quantity ranges and their costs


# Product Shipping Rule Schemas
class ProductShippingRuleCreate(BaseModel):
    product_id: int
    shipping_method_id: int
    min_quantity: int
    max_quantity: Optional[int] = None
    cost_adjustment: float
    adjustment_type: AdjustmentType = AdjustmentType.PER_ITEM
    is_active: bool = True
    priority: int = 0


class ProductShippingRuleUpdate(BaseModel):
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None
    cost_adjustment: Optional[float] = None
    adjustment_type: Optional[AdjustmentType] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class ProductShippingRuleOut(BaseModel):
    id: int
    product_id: int
    shipping_method_id: int
    min_quantity: int
    max_quantity: Optional[int] = None
    cost_adjustment: float
    adjustment_type: AdjustmentType
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value):
        if isinstance(value, datetime):
            return value.isoformat()
        return value


# Product-wise shipping calculation schemas
class ProductShippingItem(BaseModel):
    product_id: int
    quantity: int


class ProductShippingCalculationRequest(BaseModel):
    shipping_method_id: int
    items: List[ProductShippingItem]


class ProductShippingBreakdown(BaseModel):
    product_id: int
    quantity: int
    base_cost: float
    applied_rules: List[dict] = []
    final_cost: float
    rule_source: str  # "product_specific" or "universal"


class ProductShippingCalculationResponse(BaseModel):
    shipping_method_id: int
    total_cost: float
    product_breakdown: List[ProductShippingBreakdown]
    delivery_days: Optional[int] = None


class ProductShippingCostPreviewResponse(BaseModel):
    product_id: int
    shipping_method_id: int
    base_cost: float
    delivery_days: Optional[int] = None
    cost_breakdown: List[dict] = []  # Different quantity ranges and their costs for this product
    has_product_rules: bool = False
