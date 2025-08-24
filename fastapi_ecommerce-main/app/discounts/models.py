from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, Enum, UniqueConstraint, text, func
from app.core.database import Base
from enum import Enum as PyEnum


class DiscountType(PyEnum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"


class QuantityDiscountRule(Base):
    __tablename__ = "quantity_discount_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    min_quantity = Column(Integer, nullable=False)
    discount_type = Column(Enum(DiscountType), nullable=False, server_default=DiscountType.PERCENTAGE.value)
    discount_value = Column(Float, nullable=False)  # Either percentage (0-100) or fixed amount
    is_active = Column(Boolean, server_default=text("1"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, nullable=False)  # Admin user ID


class ProductDiscountAssignment(Base):
    __tablename__ = "product_discount_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, index=True)  # No FK - microservice ready
    discount_rule_id = Column(Integer, nullable=False, index=True)  # No FK - microservice ready
    is_active = Column(Boolean, server_default=text("1"))
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, nullable=False)  # Admin user ID
    
    # Unique constraint to prevent duplicate assignments
    __table_args__ = (UniqueConstraint('product_id', 'discount_rule_id', name='unique_product_discount'),)
