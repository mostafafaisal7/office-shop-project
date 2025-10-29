from sqlalchemy import Column, Integer, String, Text, Float, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.common.models import TimestampMixin, UserTrackingMixin
from app.core.database import Base

class CartItem(Base, TimestampMixin, UserTrackingMixin):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # not FK for microservice isolation, indexed for fast queries
    guest_id = Column(String(255), nullable=True, index=True)  # For anonymous users, indexed for fast queries

    product_id = Column(Integer, index=True)
    product_name = Column(String(255))
    product_price = Column(Float)
    quantity = Column(Integer, default=1)
    size = Column(String(255), nullable=True)
    color = Column(String(255), nullable=True)

    customization_id = Column(Integer, nullable=True, index=True)  # indexed for fast queries
    customized_images = Column(JSON, nullable=True)  # stores array of preview image URLs

    # Design data for print-ready files (snapshot from design time)
    design_canvas_data = Column(JSON, nullable=True)  # Complete Fabric.js canvas data from all design areas
    design_svg_data = Column(Text, nullable=True)  # SVG data for print-ready designs
    design_elements = Column(JSON, nullable=True)  # Simplified design elements list

    # Composite indexes for common query patterns
    __table_args__ = (
        # Index for finding existing cart items (deduplication check)
        Index('idx_cart_user_product_size_custom', 'user_id', 'product_id', 'size', 'customization_id'),
        # Index for guest cart queries
        Index('idx_cart_guest_product_size_custom', 'guest_id', 'product_id', 'size', 'customization_id'),
    )
