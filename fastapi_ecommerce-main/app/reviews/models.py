from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, JSON, Enum, ForeignKey, text, func
from sqlalchemy.orm import relationship, declarative_base
from app.core.database import Base
from datetime import datetime, timezone
from enum import Enum as PyEnum


class ReviewStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, index=True)  # Reference to product (no FK for microservice independence)
    user_id = Column(Integer, nullable=False, index=True)     # Reference to user (no FK for microservice independence)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255))
    comment = Column(Text)
    status = Column(Enum(ReviewStatus), server_default=ReviewStatus.PENDING.value)
    is_verified_purchase = Column(Boolean, server_default=text("0"))  # Whether user actually bought the product
    helpful_count = Column(Integer, server_default=text("0"))  # Number of users who found this helpful
    
    # Additional metadata that might be useful for microservice
    product_name = Column(String(255))  # Cached product name for display
    user_name = Column(String(255))     # Cached user name for display
    user_email = Column(String(255))    # Cached user email for notifications
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
    is_active = Column(Boolean, server_default=text("1"))
    
    # Relationships
    media = relationship("ReviewMedia", back_populates="review", cascade="all, delete-orphan")
    helpful_votes = relationship("ReviewHelpfulVote", back_populates="review", cascade="all, delete-orphan")


class ReviewMedia(Base):
    __tablename__ = "review_media"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    media_type = Column(String(50), nullable=False)  # 'image', 'video'
    mime_type = Column(String(100))
    alt_text = Column(String(255))
    sort_order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    review = relationship("Review", back_populates="media")


class ReviewHelpfulVote(Base):
    __tablename__ = "review_helpful_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(Integer, nullable=False, index=True)  # Reference to user (no FK for microservice independence)
    is_helpful = Column(Boolean, nullable=False)  # True for helpful, False for not helpful
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    review = relationship("Review", back_populates="helpful_votes")


class ReviewSummary(Base):
    __tablename__ = "review_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, unique=True, nullable=False, index=True)  # Reference to product
    total_reviews = Column(Integer, server_default=text("0"))
    average_rating = Column(DECIMAL(3, 2), server_default=text("0.00"))  # e.g., 4.25
    
    # Rating distribution
    rating_1_count = Column(Integer, server_default=text("0"))
    rating_2_count = Column(Integer, server_default=text("0"))
    rating_3_count = Column(Integer, server_default=text("0"))
    rating_4_count = Column(Integer, server_default=text("0"))
    rating_5_count = Column(Integer, server_default=text("0"))
    
    # Cached product info for microservice independence
    product_name = Column(String(255))
    
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
