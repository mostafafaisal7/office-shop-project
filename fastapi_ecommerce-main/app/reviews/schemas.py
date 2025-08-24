from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from enum import Enum


# -------------------------------
# Enums
# -------------------------------

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


# -------------------------------
# Review Media
# -------------------------------

class ReviewMediaBase(BaseModel):
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    media_type: MediaType
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    sort_order: int = 0


class ReviewMediaCreate(ReviewMediaBase):
    pass


class ReviewMediaUpdate(BaseModel):
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    media_type: Optional[MediaType] = None
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    sort_order: Optional[int] = None


class ReviewMediaUpdateWithID(ReviewMediaUpdate):
    id: Optional[int] = None


class ReviewMediaResponse(ReviewMediaBase):
    id: int
    review_id: int
    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }


# -------------------------------
# Review Helpful Vote
# -------------------------------

class ReviewHelpfulVoteBase(BaseModel):
    is_helpful: bool


class ReviewHelpfulVoteCreate(ReviewHelpfulVoteBase):
    review_id: int
    user_id: int


class ReviewHelpfulVoteResponse(ReviewHelpfulVoteBase):
    id: int
    review_id: int
    user_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# -------------------------------
# Review
# -------------------------------

class ReviewBase(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5, description="Rating must be between 1 and 5")
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None
    is_verified_purchase: bool = False
    
    # Cached data for microservice independence
    product_name: Optional[str] = Field(None, max_length=255)
    user_name: Optional[str] = Field(None, max_length=255)
    user_email: Optional[str] = Field(None, max_length=255)

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v


class ReviewCreate(ReviewBase):
    media: Optional[List[ReviewMediaCreate]] = Field(default_factory=list)


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None
    status: Optional[ReviewStatus] = None
    is_verified_purchase: Optional[bool] = None
    product_name: Optional[str] = Field(None, max_length=255)
    user_name: Optional[str] = Field(None, max_length=255)
    user_email: Optional[str] = Field(None, max_length=255)
    media: Optional[List[ReviewMediaUpdateWithID]] = None

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v is not None and not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    status: ReviewStatus
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    media: List[ReviewMediaResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }


# -------------------------------
# Review Summary
# -------------------------------

class ReviewSummaryBase(BaseModel):
    product_id: int
    total_reviews: int = 0
    average_rating: Decimal = Field(default=Decimal('0.00'))
    rating_1_count: int = 0
    rating_2_count: int = 0
    rating_3_count: int = 0
    rating_4_count: int = 0
    rating_5_count: int = 0
    product_name: Optional[str] = None


class ReviewSummaryResponse(ReviewSummaryBase):
    id: int
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# -------------------------------
# Filters & Search
# -------------------------------

class ReviewFilters(BaseModel):
    product_id: Optional[int] = None
    user_id: Optional[int] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[ReviewStatus] = None
    is_verified_purchase: Optional[bool] = None
    search: Optional[str] = None  # Search in title, comment


class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    page: int
    per_page: int
    pages: int


# -------------------------------
# Statistics
# -------------------------------

class ReviewStatsResponse(BaseModel):
    total_reviews: int
    average_rating: Decimal
    rating_distribution: dict[int, int]  # {1: 5, 2: 10, 3: 20, 4: 30, 5: 35}
    recent_reviews_count: int  # Reviews in last 30 days
