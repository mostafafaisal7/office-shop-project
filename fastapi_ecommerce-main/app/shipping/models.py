from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base
# from app.common.enums import CountryCode  # optional

class AdjustmentType(enum.Enum):
    PER_ITEM = "per_item"
    FLAT_RATE = "flat_rate"

class ShippingAddress(Base):
    __tablename__ = "shipping_addresses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=True)  # nullable for guest checkout
    guest_id = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    address_line = Column(String(255), nullable=False)
    city = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    postal_code = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)  # or Enum(CountryCode)


class ShippingMethod(Base):
    __tablename__ = "shipping_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    cost = Column(Float, default=0.0)
    delivery_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationship to cost rules
    cost_rules = relationship("ShippingCostRule", back_populates="shipping_method", cascade="all, delete-orphan")


class ShippingCostRule(Base):
    __tablename__ = "shipping_cost_rules"

    id = Column(Integer, primary_key=True, index=True)
    shipping_method_id = Column(Integer, ForeignKey("shipping_methods.id"), nullable=False)
    min_quantity = Column(Integer, nullable=False)
    max_quantity = Column(Integer, nullable=True)  # null means no upper limit
    cost_adjustment = Column(Float, nullable=False)
    adjustment_type = Column(Enum(AdjustmentType), default=AdjustmentType.PER_ITEM)
    is_active = Column(Boolean, default=True)
    
    # Relationship back to shipping method
    shipping_method = relationship("ShippingMethod", back_populates="cost_rules")


class ProductShippingRule(Base):
    __tablename__ = "product_shipping_rules"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, index=True)  # No FK - microservice ready
    shipping_method_id = Column(Integer, ForeignKey("shipping_methods.id"), nullable=False)
    min_quantity = Column(Integer, nullable=False)
    max_quantity = Column(Integer, nullable=True)  # null means no upper limit
    cost_adjustment = Column(Float, nullable=False)
    adjustment_type = Column(Enum(AdjustmentType), default=AdjustmentType.PER_ITEM)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher priority rules override lower ones
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
    
    # Only relationship within shipping module
    shipping_method = relationship("ShippingMethod")
