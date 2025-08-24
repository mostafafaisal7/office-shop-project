from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.discounts.models import DiscountType


# Base schemas
class DiscountRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    min_quantity: int = Field(..., gt=0)
    discount_type: DiscountType
    discount_value: float = Field(..., gt=0)
    is_active: bool = True

    @validator('discount_value')
    def validate_discount_value(cls, v, values):
        discount_type = values.get('discount_type')
        if discount_type == DiscountType.PERCENTAGE and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v


class DiscountRuleCreate(DiscountRuleBase):
    created_by: int


class DiscountRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    min_quantity: Optional[int] = Field(None, gt=0)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None

    @validator('discount_value')
    def validate_discount_value(cls, v, values):
        if v is not None:
            discount_type = values.get('discount_type')
            if discount_type == DiscountType.PERCENTAGE and v > 100:
                raise ValueError('Percentage discount cannot exceed 100%')
        return v


class DiscountRuleResponse(DiscountRuleBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Product Assignment schemas
class ProductDiscountAssignmentBase(BaseModel):
    product_id: int
    discount_rule_id: int
    is_active: bool = True


class ProductDiscountAssignmentCreate(ProductDiscountAssignmentBase):
    assigned_by: int


class ProductDiscountAssignmentUpdate(BaseModel):
    is_active: Optional[bool] = None


class ProductDiscountAssignmentResponse(ProductDiscountAssignmentBase):
    id: int
    assigned_by: int
    assigned_at: datetime

    class Config:
        from_attributes = True


# Extended response with rule details
class ProductDiscountAssignmentWithRule(ProductDiscountAssignmentResponse):
    rule: DiscountRuleResponse


# Bulk assignment schema
class BulkProductAssignmentCreate(BaseModel):
    product_ids: List[int] = Field(..., min_length=1)
    discount_rule_id: int
    assigned_by: int


# Discount calculation schemas
class DiscountCalculationRequest(BaseModel):
    product_id: int
    quantity: int


class DiscountCalculationResponse(BaseModel):
    applicable: bool
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = None
    discount_amount: Optional[float] = None  # Actual amount to be discounted
    rule_name: Optional[str] = None
    rule_id: Optional[int] = None
    min_quantity_met: Optional[int] = None


# List responses
class DiscountRuleListResponse(BaseModel):
    rules: List[DiscountRuleResponse]
    total: int
    page: int
    per_page: int


class ProductDiscountAssignmentListResponse(BaseModel):
    assignments: List[ProductDiscountAssignmentWithRule]
    total: int
    page: int
    per_page: int


# Toggle schema
class ToggleStatusResponse(BaseModel):
    id: int
    is_active: bool
    message: str
