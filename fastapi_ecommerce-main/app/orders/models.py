# app/orders/models.py

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from sqlalchemy import Enum as SqlAlchemyEnum
from datetime import datetime
from app.core.database import Base
from app.common.enums import OrderStatus
import uuid


class Order(Base):
    __tablename__ = "orders"

    id = sa.Column(sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.Integer, nullable=True)
    guest_id = sa.Column(sa.String(255), nullable=True)
    subtotal = sa.Column(sa.Float, nullable=False)  # Product total without shipping
    shipping_cost = sa.Column(sa.Float, nullable=True, default=0.0)  # Calculated shipping cost
    total_price = sa.Column(sa.Float, nullable=False)  # subtotal + shipping_cost
    shipping_method_id = sa.Column(sa.Integer, nullable=True)  # Reference to shipping method used
    estimated_delivery_days = sa.Column(sa.Integer, nullable=True)  # Delivery estimate
    shipping_cost_breakdown = sa.Column(sa.JSON, nullable=True)  # Detailed cost calculation
    payment_method_id = sa.Column(sa.Integer, nullable=True)  # Reference to payment method used
    shipping_address_id = sa.Column(sa.String(255), nullable=True)  # Reference to shipping address
    status = sa.Column(
        SqlAlchemyEnum(OrderStatus),
        server_default=text(f"'{OrderStatus.PENDING.value}'"),
        nullable=False
    )
    tracking_info = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(
        sa.DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )

    items = relationship("OrderItem", back_populates="order", cascade="all, delete")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    order_id = sa.Column(sa.String(36), sa.ForeignKey("orders.id"), nullable=False)
    product_id = sa.Column(sa.Integer, nullable=False)
    product_name = sa.Column(sa.String(255), nullable=False)
    variation_id = sa.Column(sa.Integer, nullable=True)
    customization_option_id = sa.Column(sa.Integer, nullable=True)
    shipping_method_id = sa.Column(sa.Integer, nullable=True)
    customized_images = sa.Column(sa.JSON, nullable=True)
    quantity = sa.Column(sa.Integer, nullable=False)
    unit_price = sa.Column(sa.Float, nullable=False)

    # Design data for print-ready files (preserved at order time)
    design_svg_data = sa.Column(sa.Text, nullable=True)  # SVG data from customization
    design_canvas_data = sa.Column(sa.JSON, nullable=True)  # Fabric.js canvas data snapshot
    design_elements = sa.Column(sa.JSON, nullable=True)  # Design elements (text, images, shapes)

    # Discount tracking fields (no FK - microservice ready)
    discount_rule_id = sa.Column(sa.Integer, nullable=True)  # Reference to discount rule used
    original_unit_price = sa.Column(sa.Float, nullable=True)  # Price before discount
    discount_percentage = sa.Column(sa.Float, nullable=True)  # Discount percentage applied
    discount_amount = sa.Column(sa.Float, nullable=True)  # Actual discount amount per unit
    discount_type = sa.Column(sa.String(20), nullable=True)  # 'percentage' or 'fixed_amount'

    order = relationship("Order", back_populates="items")
