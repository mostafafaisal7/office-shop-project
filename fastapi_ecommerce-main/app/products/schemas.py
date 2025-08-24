from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime
from enum import Enum
import re

# -------------------------------
# Enums
# -------------------------------

class ProductStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"

class AreaType(str, Enum):
    FRONT = "front"
    BACK = "back"
    LEFT = "left"
    RIGHT = "right"
# -------------------------------
# Variation Media
# -------------------------------

class VariationMediaBase(BaseModel):
    file_path: str
    file_name: str
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    design: bool = False  
    area: AreaType = AreaType.FRONT  
    sort_order: int = 0

class VariationMediaResponse(VariationMediaBase):
    id: int
    variation_id: int
    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }

class VariationMediaCreate(VariationMediaBase):
    variation_id: int

class VariationMediaUpdate(BaseModel):
    id: Optional[int] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    media_type: Optional[MediaType] = None
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    design: Optional[bool] = None
    area: Optional[AreaType] = None
    sort_order: Optional[int] = None

class VariationMediaUpdateWithID(BaseModel):
    id: Optional[int] = None
    file_path: str
    file_name: str
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    design: bool = False
    area: AreaType = AreaType.FRONT
    sort_order: int = 0

# -------------------------------
# Product Variation
# -------------------------------

class ProductVariationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    price: Optional[Decimal] = None
    stock_quantity: int = Field(ge=0)
    low_stock_threshold: int = Field(ge=0, default=5)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    sort_order: int = 0

class ProductVariationCreate(ProductVariationBase):
    media: Optional[List[VariationMediaBase]] = Field(default_factory=list)

class ProductVariationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    attributes: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class ProductVariationUpdateWithID(ProductVariationUpdate):
    id: Optional[int] = None
    media: Optional[List[VariationMediaUpdateWithID]] = None

class ProductVariationResponse(ProductVariationBase):
    id: int
    product_id: int
    created_at: datetime
    media: List[VariationMediaResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Customization Option Media
# -------------------------------

class CustomizationOptionMediaBase(BaseModel):
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    canvas_object_id: Optional[str] = None
    layer_order: int = 0

class CustomizationOptionMediaCreate(CustomizationOptionMediaBase):
    customization_option_id: int

class CustomizationOptionMediaUpdate(BaseModel):
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    media_type: Optional[MediaType] = None
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    canvas_object_id: Optional[str] = None
    layer_order: Optional[int] = None

class CustomizationOptionMediaResponse(CustomizationOptionMediaBase):
    id: int
    customization_option_id: int
    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Design Element Schemas
# -------------------------------

class DesignElementBase(BaseModel):
    type: str  # "text", "image", etc.
    content: Optional[str] = None
    src: Optional[str] = None  # for images
    position: Dict[str, float]  # {"x": 100, "y": 150}
    style: Optional[Dict[str, Any]] = None  # fontSize, fontFamily, color, etc.
    dimensions: Optional[Dict[str, float]] = None  # {"width": 100, "height": 100}

class CanvasDataBase(BaseModel):
    version: str = "5.3.0"
    objects: List[Dict[str, Any]] = Field(default_factory=list)
    background: str = ""
    backgroundImage: Dict[str, Any] = Field(default_factory=dict)

class DesignMetadataBase(BaseModel):
    canvas_width: int
    canvas_height: int
    product_image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    design_name: Optional[str] = None
    is_completed: bool = False

# -------------------------------
# Customization Option (User Design)
# -------------------------------

class CustomizationOptionBase(BaseModel):
    client_reference_id: Optional[str] = None  # Optional client-side reference
    user_id: int
    product_id: int
    variation_id: int
    design_area: AreaType  # front/back/left/right
    canvas_data: CanvasDataBase
    design_metadata: DesignMetadataBase
    design_elements: List[DesignElementBase] = Field(default_factory=list)

class CustomizationOptionCreate(BaseModel):
    client_reference_id: Optional[str] = None  # Optional client-side reference
    user_id: int
    product_id: int
    variation_id: int
    design_area: AreaType
    canvas_data: CanvasDataBase
    design_metadata: DesignMetadataBase
    design_elements: List[DesignElementBase] = Field(default_factory=list)

class CustomizationOptionUpdate(BaseModel):
    client_reference_id: Optional[str] = None
    canvas_data: Optional[CanvasDataBase] = None
    design_metadata: Optional[DesignMetadataBase] = None
    design_elements: Optional[List[DesignElementBase]] = None

class CustomizationOptionUpdateWithID(CustomizationOptionUpdate):
    id: Optional[int] = None

class CustomizationOptionResponse(CustomizationOptionBase):
    id: int  # Auto-generated backend ID
    created_at: datetime
    updated_at: datetime
    media: List[CustomizationOptionMediaResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Product Media
# -------------------------------

class ProductMediaBase(BaseModel):
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0

class ProductMediaCreate(ProductMediaBase):
    pass

class ProductMediaUpdateWithID(BaseModel):
    id: Optional[int] = None
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0

class ProductMediaResponse(ProductMediaBase):
    id: int
    product_id: int
    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Product
# -------------------------------

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    short_description: Optional[str] = None
    description: Optional[str] = None
    features: Optional[str] = None
    sku: str = Field(min_length=1, max_length=100)
    base_price: Decimal = Field(gt=0)
    status: ProductStatus = ProductStatus.DRAFT
    is_customizable: bool = False
    weight: Optional[Decimal] = None
    dimensions: Optional[Dict[str, float]] = None
    tags: List[str] = Field(default_factory=list)
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = Field(None, max_length=500)
    category_ids: List[int] = []

class ProductCreate(ProductBase):
    slug: Optional[str] = None
    variations: Optional[List[ProductVariationCreate]] = Field(default_factory=list)
    customization_options: Optional[List[CustomizationOptionCreate]] = Field(default_factory=list)
    media: Optional[List[ProductMediaCreate]] = Field(default_factory=list)

    @model_validator(mode="after")
    def generate_slug_if_missing(self) -> "ProductCreate":
        if not self.slug:
            if not self.name:
                raise ValueError("Slug could not be generated because 'name' is missing.")
            self.slug = re.sub(r"\W+", "-", self.name.lower()).strip("-")
        return self

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    features: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, gt=0)
    status: Optional[ProductStatus] = None
    is_customizable: Optional[bool] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[Dict[str, float]] = None
    tags: Optional[List[str]] = None
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = Field(None, max_length=500)
    category_ids: List[int] = []

    variations: Optional[List[ProductVariationUpdateWithID]] = None
    customization_options: Optional[List[CustomizationOptionUpdateWithID]] = None
    media: Optional[List[ProductMediaUpdateWithID]] = None

    @model_validator(mode="after")
    def generate_slug_if_missing(self) -> "ProductUpdate":
        if not self.slug and self.name:
            self.slug = re.sub(r"\W+", "-", self.name.lower()).strip("-")
        return self

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    variations: List[ProductVariationResponse] = Field(default_factory=list)
    customization_options: List[CustomizationOptionResponse] = Field(default_factory=list)
    media: List[ProductMediaResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Review Schemas (for product response)
# -------------------------------

class ReviewMediaResponse(BaseModel):
    id: int
    file_path: str
    file_name: str
    media_type: str
    alt_text: Optional[str] = None

class HelpfulReviewResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    helpful_count: int
    created_at: str
    is_verified_purchase: bool
    media: List[ReviewMediaResponse] = Field(default_factory=list)

class ReviewSummaryResponse(BaseModel):
    product_id: int
    total_reviews: int
    average_rating: float
    rating_1_count: int
    rating_2_count: int
    rating_3_count: int
    rating_4_count: int
    rating_5_count: int

# -------------------------------
# Enhanced Product Response with Reviews
# -------------------------------

class ProductWithReviewsResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    variations: List[ProductVariationResponse] = Field(default_factory=list)
    customization_options: List[CustomizationOptionResponse] = Field(default_factory=list)
    media: List[ProductMediaResponse] = Field(default_factory=list)
    
    # Review data
    review_summary: Optional[ReviewSummaryResponse] = None
    helpful_reviews: List[HelpfulReviewResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }

# -------------------------------
# Filters & Search
# -------------------------------

class ProductFilters(BaseModel):
    category_id: Optional[int] = None
    status: Optional[ProductStatus] = None
    is_customizable: Optional[bool] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None  # Search in name, description, sku

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    pages: int
