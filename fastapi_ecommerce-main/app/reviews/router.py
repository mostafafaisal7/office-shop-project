from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import time
import logging
from app.reviews import schemas, service, crud, models
from app.core.database import get_db
from app.common.dependencies import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/", 
    response_model=schemas.ReviewResponse, 
    status_code=status.HTTP_201_CREATED
)
async def create_review(
    review_data: schemas.ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new review"""
    return await service.create_review_with_media(db, review_data, user_id=current_user.id)


@router.get("/", response_model=schemas.ReviewListResponse)
async def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    status: Optional[schemas.ReviewStatus] = Query(None),
    is_verified_purchase: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List reviews with filtering and pagination"""
    filters = schemas.ReviewFilters(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        status=status,
        is_verified_purchase=is_verified_purchase,
        search=search
    )
    return await service.get_reviews_with_pagination(db, skip, limit, filters)


@router.get("/{review_id}", response_model=schemas.ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific review by ID"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.put("/{review_id}", response_model=schemas.ReviewResponse)
async def update_review(
    review_id: int,
    review_data: schemas.ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a review (only by the review owner)"""
    return await service.update_review_with_media(db, review_id, review_data, user_id=current_user.id)


@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a review (only by the review owner)"""
    return await service.delete_review_with_cleanup(db, review_id, user_id=current_user.id)


# ==== Product Reviews ====
@router.get("/products/{product_id}/reviews", response_model=schemas.ReviewListResponse)
async def get_product_reviews(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[schemas.ReviewStatus] = Query(schemas.ReviewStatus.APPROVED),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a specific product"""
    return await service.get_product_reviews_with_pagination(db, product_id, skip, limit, status)


@router.get("/products/{product_id}/summary", response_model=Optional[schemas.ReviewSummaryResponse])
async def get_product_review_summary(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get review summary for a specific product"""
    start_time = time.perf_counter()
    result = await service.get_product_review_summary(db, product_id)
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    logger.info(f"⚡ [REVIEWS] Product {product_id} summary fetch: {elapsed_ms:.2f}ms")
    return result


@router.get("/products/{product_id}/stats", response_model=schemas.ReviewStatsResponse)
async def get_product_review_stats(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get review statistics for a specific product"""
    return await service.get_review_statistics(db, product_id)


@router.get("/product/{product_id}/helpful", response_model=schemas.ReviewListResponse)
async def get_most_helpful_reviews(
    product_id: int,
    limit: int = Query(5, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    """Get most helpful reviews for a product"""
    start_time = time.perf_counter()
    result = await service.get_most_helpful_reviews_for_product(db, product_id, limit)
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    logger.info(f"⚡ [REVIEWS] Product {product_id} helpful reviews fetch: {elapsed_ms:.2f}ms")
    return result


# ==== User Reviews ====
@router.get("/users/{user_id}/reviews", response_model=schemas.ReviewListResponse)
async def get_user_reviews(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews by a specific user"""
    return await service.get_user_reviews_with_pagination(db, user_id, skip, limit)


@router.get("/users/me/reviews", response_model=schemas.ReviewListResponse)
async def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current user's reviews"""
    return await service.get_user_reviews_with_pagination(db, current_user.id, skip, limit)


# ==== Review Media ====
@router.post("/{review_id}/media", response_model=schemas.ReviewMediaResponse, status_code=status.HTTP_201_CREATED)
async def create_review_media(
    review_id: int,
    media_data: schemas.ReviewMediaCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add media to a review"""
    return await service.create_review_media(db, review_id, media_data, user_id=current_user.id)


@router.get("/media/{media_id}", response_model=schemas.ReviewMediaResponse)
async def get_review_media(media_id: int, db: AsyncSession = Depends(get_db)):
    """Get review media by ID"""
    media = await crud.get_review_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Review media not found")
    return media


@router.put("/media/{media_id}", response_model=schemas.ReviewMediaResponse)
async def update_review_media(
    media_id: int,
    media_data: schemas.ReviewMediaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update review media"""
    return await service.update_review_media(db, media_id, media_data, user_id=current_user.id)


@router.delete("/media/{media_id}", status_code=status.HTTP_200_OK)
async def delete_review_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete review media"""
    return await service.delete_review_media(db, media_id, user_id=current_user.id)


# ==== Helpful Votes ====
@router.post("/{review_id}/helpful", status_code=status.HTTP_200_OK)
async def vote_helpful(
    review_id: int,
    is_helpful: bool = Query(..., description="True for helpful, False for not helpful"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Vote on whether a review is helpful"""
    return await service.toggle_helpful_vote(db, review_id, current_user.id, is_helpful)


@router.get("/{review_id}/votes", response_model=List[schemas.ReviewHelpfulVoteResponse])
async def get_review_votes(review_id: int, db: AsyncSession = Depends(get_db)):
    """Get helpful votes for a review"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review.helpful_votes


# ==== Admin Endpoints ====
@router.put("/{review_id}/approve", response_model=schemas.ReviewResponse, dependencies=[Depends(require_admin)])
async def approve_review(review_id: int, db: AsyncSession = Depends(get_db)):
    """Approve a review (admin only)"""
    return await service.approve_review(db, review_id)


@router.put("/{review_id}/reject", response_model=schemas.ReviewResponse, dependencies=[Depends(require_admin)])
async def reject_review(review_id: int, db: AsyncSession = Depends(get_db)):
    """Reject a review (admin only)"""
    return await service.reject_review(db, review_id)


@router.get("/admin/pending", response_model=schemas.ReviewListResponse, dependencies=[Depends(require_admin)])
async def get_pending_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get pending reviews for admin approval"""
    filters = schemas.ReviewFilters(status=schemas.ReviewStatus.PENDING)
    return await service.get_reviews_with_pagination(db, skip, limit, filters)


@router.put("/products/{product_id}/summary/refresh", response_model=Optional[schemas.ReviewSummaryResponse], dependencies=[Depends(require_admin)])
async def refresh_product_review_summary(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Refresh review summary for a product (admin only)"""
    return await service.update_product_review_summary(db, product_id)


# ==== Statistics ====
@router.get("/stats/global", response_model=schemas.ReviewStatsResponse)
async def get_global_review_stats(db: AsyncSession = Depends(get_db)):
    """Get global review statistics"""
    return await service.get_review_statistics(db)
