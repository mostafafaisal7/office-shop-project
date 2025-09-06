from sqlalchemy import Column, Integer, String, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.common.models import TimestampMixin, UserTrackingMixin
from app.core.database import Base

class CartItem(Base, TimestampMixin, UserTrackingMixin):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # not FK for microservice isolation
    guest_id = Column(String(255), nullable=True)  # For anonymous users
    
    product_id = Column(Integer, index=True)
    product_name = Column(String(255))
    product_price = Column(Float)
    quantity = Column(Integer, default=1)
    size = Column(String(255), nullable=True)
    color = Column(String(255), nullable=True)

    customization_id = Column(Integer, nullable=True)  # stores user's selections like text, color, size
    customized_images = Column(JSON, nullable=True)  # stores array of preview image URLs
