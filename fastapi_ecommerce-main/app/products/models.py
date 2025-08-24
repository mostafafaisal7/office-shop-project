from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, JSON, Enum, ForeignKey, text, func
from sqlalchemy.orm import relationship, declarative_base
from app.core.database import Base
from app.common.enums import AreaType, ProductStatus, MediaType
from datetime import datetime, timezone
import uuid

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    short_description = Column(Text)
    description = Column(Text)
    features = Column(Text)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(Enum(ProductStatus), server_default=ProductStatus.DRAFT)
    is_customizable = Column(Boolean, server_default=text("0"))
    weight = Column(DECIMAL(8, 2))  # for shipping calculations
    dimensions = Column(JSON)  # {"length": 10, "width": 5, "height": 3}
    tags = Column(JSON)  # ["tag1", "tag2"]
    seo_title = Column(String(255))
    seo_description = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
    is_active = Column(Boolean, server_default=text("1"))
    user_id = Column(Integer, nullable=False)
    
    # Relationships
    variations = relationship("ProductVariation", back_populates="product", cascade="all, delete-orphan")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    customization_options = relationship("CustomizationOption", back_populates="product", cascade="all, delete-orphan")
    
    
class ProductVariation(Base):
    __tablename__ = "product_variations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Red - Large"
    sku = Column(String(255), nullable=False, unique=True, index=True)
    price = Column(DECIMAL(10, 2))  # Override base price if needed
    stock_quantity = Column(Integer, server_default=text("0"))
    low_stock_threshold = Column(Integer, server_default=text("5"))
    attributes = Column(JSON)  # {"color": "red", "size": "large"}
    is_active = Column(Boolean, server_default=text("1"))
    sort_order = Column(Integer, server_default=text("0"))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="variations")
    media = relationship("VariationMedia", back_populates="variation", cascade="all, delete-orphan")
    
    
class CustomizationOption(Base):
    __tablename__ = "customization_options"
    
    id = Column(Integer, primary_key=True, index=True)  # Auto-incrementing primary key
    client_reference_id = Column(String(255), nullable=True, index=True)  # Optional client-side reference
    user_id = Column(Integer, nullable=False)  # User who created the design
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variation_id = Column(Integer, ForeignKey("product_variations.id"), nullable=False)
    design_area = Column(Enum(AreaType), nullable=False)  # front/back/left/right
    
    # Complete Fabric.js canvas JSON
    canvas_data = Column(JSON, nullable=False)
    
    # Design metadata
    design_metadata = Column(JSON, nullable=False)
    
    # Individual design elements for easier querying
    design_elements = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="customization_options")
    variation = relationship("ProductVariation")
    media = relationship("CustomizationOptionMedia", back_populates="customization_option", cascade="all, delete-orphan")


class CustomizationOptionMedia(Base):
    __tablename__ = "customization_option_media"
    
    id = Column(Integer, primary_key=True, index=True)
    customization_option_id = Column(Integer, ForeignKey("customization_options.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    media_type = Column(Enum(MediaType), nullable=False)
    mime_type = Column(String(100))
    alt_text = Column(String(255))
    
    # Design-specific fields
    canvas_object_id = Column(String(100))  # Links to specific object in Fabric.js canvas
    layer_order = Column(Integer, default=0)  # Z-index in the design
    
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    customization_option = relationship("CustomizationOption", back_populates="media")
    
    
class ProductMedia(Base):
    __tablename__ = "product_media"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    media_type = Column(Enum(MediaType), nullable=False)
    mime_type = Column(String(100))
    alt_text = Column(String(255))
    is_primary = Column(Boolean, server_default=text("0"))
    sort_order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    product = relationship("Product", back_populates="media")
    
    
class VariationMedia(Base):
    __tablename__ = "variation_media"
    
    id = Column(Integer, primary_key=True, index=True)
    variation_id = Column(Integer, ForeignKey("product_variations.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)
    mime_type = Column(String(100))
    alt_text = Column(String(255))
    design = Column(Boolean, server_default=text("0"))
    area = Column(Enum(AreaType), server_default=AreaType.FRONT)
    sort_order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    variation = relationship("ProductVariation", back_populates="media")

    
class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, nullable=False, index=True)
    category_id = Column(Integer, nullable=False, index=True)
