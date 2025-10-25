from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func, and_, desc, asc, case
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from app.reviews import models, schemas


# ==== Review ====
async def create_review(db: AsyncSession, review: models.Review) -> models.Review:
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_review(db: AsyncSession, review_id: int) -> Optional[models.Review]:
    result = await db.execute(
        select(models.Review)
        .options(selectinload(models.Review.media))
        .options(selectinload(models.Review.helpful_votes))
        .where(models.Review.id == review_id)
    )
    return result.scalar_one_or_none()


async def get_reviews(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[schemas.ReviewFilters] = None
) -> Tuple[List[models.Review], int]:
    """Get reviews with optional filters and pagination

    OPTIMIZED:
    - Uses joinedload instead of selectinload to reduce from 3 queries to 1 query with JOINs
    - Uses direct count query instead of subquery for better performance
    """
    # Build WHERE conditions
    where_conditions = []
    if filters:
        if filters.product_id:
            where_conditions.append(models.Review.product_id == filters.product_id)
        if filters.user_id:
            where_conditions.append(models.Review.user_id == filters.user_id)
        if filters.rating:
            where_conditions.append(models.Review.rating == filters.rating)
        if filters.status:
            where_conditions.append(models.Review.status == filters.status)
        if filters.is_verified_purchase is not None:
            where_conditions.append(models.Review.is_verified_purchase == filters.is_verified_purchase)
        if filters.search:
            search_term = f"%{filters.search}%"
            where_conditions.append(
                models.Review.title.ilike(search_term) |
                models.Review.comment.ilike(search_term)
            )

    # Get total count with optimized query (no subquery)
    count_query = select(func.count(models.Review.id))
    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results with joinedload
    query = select(models.Review).options(
        joinedload(models.Review.media),
        joinedload(models.Review.helpful_votes)
    )
    if where_conditions:
        query = query.where(and_(*where_conditions))

    query = query.order_by(desc(models.Review.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    reviews = list(result.unique().scalars().all())

    return reviews, total


async def get_reviews_by_product(
    db: AsyncSession,
    product_id: int,
    skip: int = 0,
    limit: int = 20,
    status: Optional[schemas.ReviewStatus] = None
) -> Tuple[List[models.Review], int]:
    """Get reviews for a product with pagination

    OPTIMIZED:
    - Uses joinedload instead of selectinload to reduce from 3 queries to 1 query with JOINs
    - Uses direct count query instead of subquery for better performance
    """
    # Build base WHERE conditions
    where_conditions = [models.Review.product_id == product_id]
    if status:
        where_conditions.append(models.Review.status == status)

    # Get total count with optimized query (no subquery)
    count_query = select(func.count(models.Review.id)).where(and_(*where_conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results with joinedload
    query = select(models.Review).options(
        joinedload(models.Review.media),
        joinedload(models.Review.helpful_votes)
    ).where(
        and_(*where_conditions)
    ).order_by(
        desc(models.Review.created_at)
    ).offset(skip).limit(limit)

    result = await db.execute(query)
    reviews = list(result.unique().scalars().all())

    return reviews, total


async def get_most_helpful_reviews_by_product(
    db: AsyncSession,
    product_id: int,
    limit: int = 5,
    status: Optional[schemas.ReviewStatus] = schemas.ReviewStatus.APPROVED
) -> List[models.Review]:
    """Get most helpful reviews for a product, sorted by helpful_count

    OPTIMIZED: Uses joinedload instead of selectinload to reduce from 3 queries to 1 query with JOINs.
    This significantly improves performance for the product page.
    """
    query = select(models.Review).options(
        joinedload(models.Review.media),
        joinedload(models.Review.helpful_votes)
    ).where(
        and_(
            models.Review.product_id == product_id,
            models.Review.status == status,
            models.Review.is_active == True
        )
    ).order_by(
        desc(models.Review.helpful_count),
        desc(models.Review.created_at)  # Secondary sort by creation date
    ).limit(limit)

    result = await db.execute(query)
    return list(result.unique().scalars().all())


async def get_reviews_by_user(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[models.Review], int]:
    """Get reviews by a specific user with pagination

    OPTIMIZED:
    - Uses joinedload instead of selectinload to reduce from 3 queries to 1 query with JOINs
    - Uses direct count query instead of subquery for better performance
    """
    # Get total count with optimized query (no subquery)
    count_query = select(func.count(models.Review.id)).where(models.Review.user_id == user_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results with joinedload
    query = select(models.Review).options(
        joinedload(models.Review.media),
        joinedload(models.Review.helpful_votes)
    ).where(
        models.Review.user_id == user_id
    ).order_by(
        desc(models.Review.created_at)
    ).offset(skip).limit(limit)

    result = await db.execute(query)
    reviews = list(result.unique().scalars().all())

    return reviews, total


async def update_review(
    db: AsyncSession, 
    review_id: int, 
    update_data: schemas.ReviewUpdate
) -> Optional[models.Review]:
    review = await get_review(db, review_id)
    if not review:
        return None
    
    for key, value in update_data.model_dump(exclude_unset=True, exclude={"media"}).items():
        setattr(review, key, value)
    
    await db.commit()
    await db.refresh(review)
    return review


async def delete_review(db: AsyncSession, review: models.Review):
    await db.delete(review)
    await db.commit()


async def get_user_review_for_product(
    db: AsyncSession, 
    user_id: int, 
    product_id: int
) -> Optional[models.Review]:
    """Check if user has already reviewed this product"""
    result = await db.execute(
        select(models.Review)
        .where(
            and_(
                models.Review.user_id == user_id,
                models.Review.product_id == product_id
            )
        )
    )
    return result.scalar_one_or_none()


# ==== Review Media ====
async def create_review_media(
    db: AsyncSession, 
    review_id: int, 
    media_data: schemas.ReviewMediaCreate
) -> models.ReviewMedia:
    media = models.ReviewMedia(
        review_id=review_id,
        **media_data.model_dump()
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def get_review_media(db: AsyncSession, media_id: int) -> Optional[models.ReviewMedia]:
    result = await db.execute(
        select(models.ReviewMedia)
        .where(models.ReviewMedia.id == media_id)
    )
    return result.scalar_one_or_none()


async def get_review_media_by_review(
    db: AsyncSession, 
    review_id: int
) -> List[models.ReviewMedia]:
    result = await db.execute(
        select(models.ReviewMedia)
        .where(models.ReviewMedia.review_id == review_id)
        .order_by(models.ReviewMedia.sort_order)
    )
    return list(result.scalars().all())


async def update_review_media(
    db: AsyncSession, 
    media_id: int, 
    update_data: schemas.ReviewMediaUpdate
) -> Optional[models.ReviewMedia]:
    media = await get_review_media(db, media_id)
    if not media:
        return None
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(media, key, value)
    
    await db.commit()
    await db.refresh(media)
    return media


async def delete_review_media(db: AsyncSession, media: models.ReviewMedia):
    await db.delete(media)
    await db.commit()


# ==== Review Helpful Votes ====
async def create_helpful_vote(
    db: AsyncSession, 
    vote_data: schemas.ReviewHelpfulVoteCreate
) -> models.ReviewHelpfulVote:
    vote = models.ReviewHelpfulVote(**vote_data.model_dump())
    db.add(vote)
    await db.commit()
    await db.refresh(vote)
    return vote


async def get_user_helpful_vote(
    db: AsyncSession, 
    review_id: int, 
    user_id: int
) -> Optional[models.ReviewHelpfulVote]:
    result = await db.execute(
        select(models.ReviewHelpfulVote)
        .where(
            and_(
                models.ReviewHelpfulVote.review_id == review_id,
                models.ReviewHelpfulVote.user_id == user_id
            )
        )
    )
    return result.scalar_one_or_none()


async def update_helpful_vote(
    db: AsyncSession, 
    vote: models.ReviewHelpfulVote, 
    is_helpful: bool
) -> models.ReviewHelpfulVote:
    await db.execute(
        models.ReviewHelpfulVote.__table__.update()
        .where(models.ReviewHelpfulVote.id == vote.id)
        .values(is_helpful=is_helpful)
    )
    await db.commit()
    await db.refresh(vote)
    return vote


async def delete_helpful_vote(db: AsyncSession, vote: models.ReviewHelpfulVote):
    await db.delete(vote)
    await db.commit()


async def update_review_helpful_count(db: AsyncSession, review_id: int):
    """Update the helpful_count for a review based on helpful votes"""
    result = await db.execute(
        select(func.count())
        .where(
            and_(
                models.ReviewHelpfulVote.review_id == review_id,
                models.ReviewHelpfulVote.is_helpful == True
            )
        )
    )
    helpful_count = result.scalar()
    
    await db.execute(
        models.Review.__table__.update()
        .where(models.Review.id == review_id)
        .values(helpful_count=helpful_count)
    )
    await db.commit()


# ==== Review Summary ====
async def get_review_summary(
    db: AsyncSession, 
    product_id: int
) -> Optional[models.ReviewSummary]:
    result = await db.execute(
        select(models.ReviewSummary)
        .where(models.ReviewSummary.product_id == product_id)
    )
    return result.scalar_one_or_none()


async def create_review_summary(
    db: AsyncSession, 
    product_id: int, 
    product_name: Optional[str] = None
) -> models.ReviewSummary:
    summary = models.ReviewSummary(
        product_id=product_id,
        product_name=product_name
    )
    db.add(summary)
    await db.commit()
    await db.refresh(summary)
    return summary


async def update_review_summary(db: AsyncSession, product_id: int):
    """Recalculate and update review summary for a product"""
    # Get all approved reviews for the product
    result = await db.execute(
        select(
            func.count(models.Review.id).label('total_reviews'),
            func.avg(models.Review.rating).label('average_rating'),
            func.sum(case((models.Review.rating == 1, 1), else_=0)).label('rating_1_count'),
            func.sum(case((models.Review.rating == 2, 1), else_=0)).label('rating_2_count'),
            func.sum(case((models.Review.rating == 3, 1), else_=0)).label('rating_3_count'),
            func.sum(case((models.Review.rating == 4, 1), else_=0)).label('rating_4_count'),
            func.sum(case((models.Review.rating == 5, 1), else_=0)).label('rating_5_count'),
        )
        .where(
            and_(
                models.Review.product_id == product_id,
                models.Review.status == schemas.ReviewStatus.APPROVED,
                models.Review.is_active == True
            )
        )
    )
    
    stats = result.first()
    if not stats:
        return None
    
    # Get or create summary
    summary = await get_review_summary(db, product_id)
    if not summary:
        summary = await create_review_summary(db, product_id)
    
    # Update summary using SQLAlchemy update
    await db.execute(
        models.ReviewSummary.__table__.update()
        .where(models.ReviewSummary.id == summary.id)
        .values(
            total_reviews=stats.total_reviews or 0,
            average_rating=round(stats.average_rating or 0, 2),
            rating_1_count=stats.rating_1_count or 0,
            rating_2_count=stats.rating_2_count or 0,
            rating_3_count=stats.rating_3_count or 0,
            rating_4_count=stats.rating_4_count or 0,
            rating_5_count=stats.rating_5_count or 0
        )
    )
    
    await db.commit()
    await db.refresh(summary)
    return summary


# ==== Statistics ====
async def get_review_stats(db: AsyncSession, product_id: Optional[int] = None) -> dict:
    """Get review statistics, optionally filtered by product"""
    query = select(models.Review).where(
        and_(
            models.Review.status == schemas.ReviewStatus.APPROVED,
            models.Review.is_active == True
        )
    )
    
    if product_id:
        query = query.where(models.Review.product_id == product_id)
    
    # Get basic stats
    result = await db.execute(
        select(
            func.count(models.Review.id).label('total_reviews'),
            func.avg(models.Review.rating).label('average_rating'),
            func.sum(case((models.Review.rating == 1, 1), else_=0)).label('rating_1_count'),
            func.sum(case((models.Review.rating == 2, 1), else_=0)).label('rating_2_count'),
            func.sum(case((models.Review.rating == 3, 1), else_=0)).label('rating_3_count'),
            func.sum(case((models.Review.rating == 4, 1), else_=0)).label('rating_4_count'),
            func.sum(case((models.Review.rating == 5, 1), else_=0)).label('rating_5_count'),
        )
        .select_from(query.subquery())
    )
    
    stats = result.first()
    
    # Get recent reviews count (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_query = query.where(models.Review.created_at >= thirty_days_ago)
    recent_result = await db.execute(
        select(func.count()).select_from(recent_query.subquery())
    )
    recent_count = recent_result.scalar()
    
    if not stats:
        return {
            'total_reviews': 0,
            'average_rating': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'recent_reviews_count': recent_count or 0
        }
    
    return {
        'total_reviews': stats.total_reviews or 0,
        'average_rating': round(stats.average_rating or 0, 2),
        'rating_distribution': {
            1: stats.rating_1_count or 0,
            2: stats.rating_2_count or 0,
            3: stats.rating_3_count or 0,
            4: stats.rating_4_count or 0,
            5: stats.rating_5_count or 0,
        },
        'recent_reviews_count': recent_count or 0
    }
