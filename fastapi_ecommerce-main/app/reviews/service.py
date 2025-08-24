from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.reviews import models, schemas, crud
from typing import List, Optional, Tuple
from decimal import Decimal


async def create_review_with_media(
    db: AsyncSession, 
    review_data: schemas.ReviewCreate, 
    user_id: int
) -> models.Review:
    """Create a review with media attachments"""
    try:
        # Check if user has already reviewed this product
        existing_review = await crud.get_user_review_for_product(
            db, user_id, review_data.product_id
        )
        if existing_review:
            raise HTTPException(
                status_code=400, 
                detail="You have already reviewed this product"
            )
        
        # Create base review
        review = models.Review(
            **review_data.model_dump(exclude={"media"}),
            user_id=user_id
        )
        db.add(review)
        await db.flush()
        
        # Handle media attachments
        for media_data in review_data.media or []:
            media = models.ReviewMedia(
                review_id=review.id,
                **media_data.model_dump()
            )
            db.add(media)
        
        await db.commit()
        
        # Re-fetch the review with all relationships loaded
        created_review = await crud.get_review(db, review.id)
        if not created_review:
            raise HTTPException(status_code=500, detail="Review created but failed to fetch")
        
        # Update review summary for the product
        await crud.update_review_summary(db, review_data.product_id)
        
        return created_review
        
    except IntegrityError as e:
        await db.rollback()
        error_details = str(e.orig).lower()
        raise HTTPException(
            status_code=400,
            detail=f"Database constraint violation: {error_details}"
        )
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}")


async def update_review_with_media(
    db: AsyncSession, 
    review_id: int, 
    review_data: schemas.ReviewUpdate,
    user_id: Optional[int] = None
) -> models.Review:
    """Update a review with media attachments"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns this review (if user_id is provided)
    if user_id and review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    try:
        # Update basic review fields
        updated_review = await crud.update_review(db, review_id, review_data)
        if not updated_review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Handle media updates
        if review_data.media is not None:
            for media_data in review_data.media:
                if media_data.id:
                    # Update existing media
                    await crud.update_review_media(db, media_data.id, media_data)
                else:
                    # Create new media
                    new_media = models.ReviewMedia(
                        review_id=review_id,
                        **media_data.model_dump(exclude={"id"})
                    )
                    db.add(new_media)
        
        await db.commit()
        
        # Update review summary for the product
        await crud.update_review_summary(db, updated_review.product_id)
        
        # Re-fetch the updated review
        final_review = await crud.get_review(db, review_id)
        return final_review
        
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update review: {str(e)}")


async def delete_review_with_cleanup(
    db: AsyncSession, 
    review_id: int, 
    user_id: Optional[int] = None
) -> dict:
    """Delete a review and update related summaries"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns this review (if user_id is provided)
    if user_id and review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    product_id = review.product_id
    
    try:
        await crud.delete_review(db, review)
        
        # Update review summary for the product
        await crud.update_review_summary(db, product_id)
        
        return {"message": "Review deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete review")


async def get_reviews_with_pagination(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[schemas.ReviewFilters] = None
) -> schemas.ReviewListResponse:
    """Get reviews with pagination and filtering"""
    reviews, total = await crud.get_reviews(db, skip, limit, filters)
    
    pages = (total + limit - 1) // limit  # Ceiling division
    page = (skip // limit) + 1
    
    return schemas.ReviewListResponse(
        reviews=[schemas.ReviewResponse.model_validate(review) for review in reviews],
        total=total,
        page=page,
        per_page=limit,
        pages=pages
    )


async def get_product_reviews_with_pagination(
    db: AsyncSession,
    product_id: int,
    skip: int = 0,
    limit: int = 20,
    status: Optional[schemas.ReviewStatus] = None
) -> schemas.ReviewListResponse:
    """Get reviews for a specific product with pagination"""
    reviews, total = await crud.get_reviews_by_product(db, product_id, skip, limit, status)
    
    pages = (total + limit - 1) // limit  # Ceiling division
    page = (skip // limit) + 1
    
    return schemas.ReviewListResponse(
        reviews=[schemas.ReviewResponse.model_validate(review) for review in reviews],
        total=total,
        page=page,
        per_page=limit,
        pages=pages
    )


async def get_user_reviews_with_pagination(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20
) -> schemas.ReviewListResponse:
    """Get reviews by a specific user with pagination"""
    reviews, total = await crud.get_reviews_by_user(db, user_id, skip, limit)
    
    pages = (total + limit - 1) // limit  # Ceiling division
    page = (skip // limit) + 1
    
    return schemas.ReviewListResponse(
        reviews=[schemas.ReviewResponse.model_validate(review) for review in reviews],
        total=total,
        page=page,
        per_page=limit,
        pages=pages
    )


# ==== Review Media ====
async def create_review_media(
    db: AsyncSession, 
    review_id: int, 
    media_data: schemas.ReviewMediaCreate,
    user_id: Optional[int] = None
) -> models.ReviewMedia:
    """Create media for a review"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns this review (if user_id is provided)
    if user_id and review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to add media to this review")
    
    return await crud.create_review_media(db, review_id, media_data)


async def update_review_media(
    db: AsyncSession, 
    media_id: int, 
    media_data: schemas.ReviewMediaUpdate,
    user_id: Optional[int] = None
) -> models.ReviewMedia:
    """Update review media"""
    media = await crud.get_review_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Review media not found")
    
    # Check if user owns this review (if user_id is provided)
    if user_id:
        review = await crud.get_review(db, media.review_id)
        if not review or review.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this media")
    
    updated_media = await crud.update_review_media(db, media_id, media_data)
    if not updated_media:
        raise HTTPException(status_code=404, detail="Review media not found")
    
    return updated_media


async def delete_review_media(
    db: AsyncSession, 
    media_id: int,
    user_id: Optional[int] = None
) -> dict:
    """Delete review media"""
    media = await crud.get_review_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Review media not found")
    
    # Check if user owns this review (if user_id is provided)
    if user_id:
        review = await crud.get_review(db, media.review_id)
        if not review or review.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this media")
    
    await crud.delete_review_media(db, media)
    return {"message": "Review media deleted successfully"}


# ==== Helpful Votes ====
async def toggle_helpful_vote(
    db: AsyncSession, 
    review_id: int, 
    user_id: int, 
    is_helpful: bool
) -> dict:
    """Toggle helpful vote for a review"""
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user is trying to vote on their own review
    if review.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own review")
    
    # Check if user has already voted
    existing_vote = await crud.get_user_helpful_vote(db, review_id, user_id)
    
    if existing_vote:
        if existing_vote.is_helpful == is_helpful:
            # Remove vote if same vote
            await crud.delete_helpful_vote(db, existing_vote)
            message = "Vote removed"
        else:
            # Update vote if different
            await crud.update_helpful_vote(db, existing_vote, is_helpful)
            message = "Vote updated"
    else:
        # Create new vote
        vote_data = schemas.ReviewHelpfulVoteCreate(
            review_id=review_id,
            user_id=user_id,
            is_helpful=is_helpful
        )
        await crud.create_helpful_vote(db, vote_data)
        message = "Vote added"
    
    # Update helpful count for the review
    await crud.update_review_helpful_count(db, review_id)
    
    return {"message": message}


# ==== Review Summary ====
async def get_product_review_summary(
    db: AsyncSession, 
    product_id: int
) -> Optional[schemas.ReviewSummaryResponse]:
    """Get review summary for a product"""
    summary = await crud.get_review_summary(db, product_id)
    if not summary:
        return None
    
    return schemas.ReviewSummaryResponse.model_validate(summary)


async def get_most_helpful_reviews_for_product(
    db: AsyncSession,
    product_id: int,
    limit: int = 5
) -> schemas.ReviewListResponse:
    """Get most helpful reviews for a product, fallback to latest reviews if less than 3 helpful"""
    # First try to get helpful reviews
    helpful_reviews = await crud.get_most_helpful_reviews_by_product(db, product_id, limit)
    
    # If we have fewer than 3 helpful reviews, get latest reviews to fill up to the limit
    if len(helpful_reviews) < 3:
        # Get latest reviews to supplement
        latest_reviews, _ = await crud.get_reviews_by_product(
            db, 
            product_id, 
            skip=0, 
            limit=limit, 
            status=schemas.ReviewStatus.APPROVED
        )
        
        # Combine helpful and latest reviews, avoiding duplicates
        helpful_review_ids = {review.id for review in helpful_reviews}
        combined_reviews = list(helpful_reviews)
        
        # Add latest reviews that aren't already in helpful reviews
        for review in latest_reviews:
            if review.id not in helpful_review_ids and len(combined_reviews) < limit:
                combined_reviews.append(review)
        
        reviews = combined_reviews
    else:
        reviews = helpful_reviews
    
    return schemas.ReviewListResponse(
        reviews=[schemas.ReviewResponse.model_validate(review) for review in reviews],
        total=len(reviews),
        page=1,
        per_page=limit,
        pages=1
    )


async def update_product_review_summary(
    db: AsyncSession, 
    product_id: int
) -> Optional[schemas.ReviewSummaryResponse]:
    """Update review summary for a product"""
    summary = await crud.update_review_summary(db, product_id)
    if not summary:
        return None
    
    return schemas.ReviewSummaryResponse.model_validate(summary)


# ==== Statistics ====
async def get_review_statistics(
    db: AsyncSession, 
    product_id: Optional[int] = None
) -> schemas.ReviewStatsResponse:
    """Get review statistics"""
    stats = await crud.get_review_stats(db, product_id)
    
    return schemas.ReviewStatsResponse(
        total_reviews=stats['total_reviews'],
        average_rating=Decimal(str(stats['average_rating'])),
        rating_distribution=stats['rating_distribution'],
        recent_reviews_count=stats['recent_reviews_count']
    )


# ==== Admin Functions ====
async def approve_review(db: AsyncSession, review_id: int) -> models.Review:
    """Approve a review (admin function)"""
    update_data = schemas.ReviewUpdate(status=schemas.ReviewStatus.APPROVED)
    updated_review = await crud.update_review(db, review_id, update_data)
    
    if not updated_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update review summary for the product
    await crud.update_review_summary(db, updated_review.product_id)
    
    return updated_review


async def reject_review(db: AsyncSession, review_id: int) -> models.Review:
    """Reject a review (admin function)"""
    update_data = schemas.ReviewUpdate(status=schemas.ReviewStatus.REJECTED)
    updated_review = await crud.update_review(db, review_id, update_data)
    
    if not updated_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update review summary for the product
    await crud.update_review_summary(db, updated_review.product_id)
    
    return updated_review
