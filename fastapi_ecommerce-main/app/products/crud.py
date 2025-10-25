from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.products import models, schemas


# ==== Product ====
async def link_product_to_categories(db: AsyncSession, product_id: int, category_ids: List[int]):
    # Delete existing links
    await db.execute(
        models.ProductCategory.__table__.delete()
        .where(models.ProductCategory.product_id == product_id)
    )

    # Add new links
    new_links = [
        models.ProductCategory(product_id=product_id, category_id=cat_id)
        for cat_id in category_ids
    ]
    db.add_all(new_links)
    await db.commit()


async def get_categories_for_product(db: AsyncSession, product_id: int) -> List[int]:
    result = await db.execute(
        select(models.ProductCategory.category_id)
        .where(models.ProductCategory.product_id == product_id)
    )
    return [row[0] for row in result.all()]


async def create_product(db: AsyncSession, product: models.Product) -> models.Product:
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def get_product(db: AsyncSession, product_id: int) -> models.Product:
    result = await db.execute(
        select(models.Product)
        .options(
            selectinload(models.Product.variations)
            .selectinload(models.ProductVariation.media)
        )
        .options(
            selectinload(models.Product.customization_options)
            .selectinload(models.CustomizationOption.media)
        )
        .options(selectinload(models.Product.media))
        .where(models.Product.id == product_id)
    )
    return result.scalars().first()


async def get_product_by_slug(db: AsyncSession, slug: str) -> Optional[models.Product]:
    result = await db.execute(
        select(models.Product)
        .where(models.Product.slug == slug)
        .options(
            selectinload(models.Product.variations)
            .selectinload(models.ProductVariation.media)
        )
        .options(
            selectinload(models.Product.customization_options)
            .selectinload(models.CustomizationOption.media)
        )
        .options(selectinload(models.Product.media))
    )
    return result.scalar_one_or_none()


async def get_products(db: AsyncSession, skip: int = 0, limit: int = 20) -> List[models.Product]:
    result = await db.execute(
        select(models.Product)
        .offset(skip)
        .limit(limit)
        .options(
            selectinload(models.Product.variations)
            .selectinload(models.ProductVariation.media)
        )
        .options(
            selectinload(models.Product.customization_options)
            .selectinload(models.CustomizationOption.media)
        )
        .options(selectinload(models.Product.media))
    )
    return list(result.scalars().all())


async def get_products_with_filters(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    is_customizable: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[List[str]] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> tuple[List[models.Product], int]:
    """Get products with search, filtering, and sorting capabilities"""
    from sqlalchemy import func, and_, or_
    
    # Base query
    query = select(models.Product).options(
        selectinload(models.Product.variations)
        .selectinload(models.ProductVariation.media)
    ).options(
        selectinload(models.Product.customization_options)
        .selectinload(models.CustomizationOption.media)
    ).options(selectinload(models.Product.media))
    
    # Count query for pagination
    count_query = select(func.count(models.Product.id))
    
    # Apply filters
    filters = []
    
    # Search functionality
    if search:
        search_term = f"%{search.lower()}%"
        search_filter = or_(
            func.lower(models.Product.name).like(search_term),
            func.lower(models.Product.description).like(search_term),
            func.lower(models.Product.short_description).like(search_term),
            func.lower(models.Product.sku).like(search_term)
        )
        filters.append(search_filter)
    
    # Category filter
    if category_id:
        # Join with ProductCategory table for category filtering
        query = query.join(
            models.ProductCategory,
            models.Product.id == models.ProductCategory.product_id
        ).where(models.ProductCategory.category_id == category_id)
        
        count_query = count_query.select_from(
            models.Product.__table__.join(
                models.ProductCategory.__table__,
                models.Product.id == models.ProductCategory.product_id
            )
        ).where(models.ProductCategory.category_id == category_id)
    
    # Status filter
    if status:
        filters.append(models.Product.status == status)
    
    # Customizable filter
    if is_customizable is not None:
        filters.append(models.Product.is_customizable == is_customizable)
    
    # Price range filters
    if min_price is not None:
        filters.append(models.Product.base_price >= min_price)
    
    if max_price is not None:
        filters.append(models.Product.base_price <= max_price)
    
    # Tags filter
    if tags:
        for tag in tags:
            filters.append(func.json_contains(models.Product.tags, f'"{tag}"'))
    
    # Apply all filters
    if filters:
        filter_condition = and_(*filters)
        query = query.where(filter_condition)
        count_query = count_query.where(filter_condition)
    
    # Apply sorting
    sort_column = getattr(models.Product, sort_by, models.Product.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute queries
    result = await db.execute(query)
    products = list(result.scalars().all())
    
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0
    
    return products, total_count


async def delete_product(db: AsyncSession, product: models.Product):
    await db.delete(product)
    await db.commit()


# ==== Variation ====
async def get_variation(db: AsyncSession, variation_id: int) -> Optional[models.ProductVariation]:
    result = await db.execute(
        select(models.ProductVariation)
        .options(selectinload(models.ProductVariation.media))
        .where(models.ProductVariation.id == variation_id)
    )
    return result.scalar_one_or_none()


async def get_variations_by_product(db: AsyncSession, product_id: int) -> List[models.ProductVariation]:
    result = await db.execute(
        select(models.ProductVariation)
        .options(selectinload(models.ProductVariation.media))
        .where(models.ProductVariation.product_id == product_id)
    )
    return list(result.scalars().all())


async def create_variation(
    db: AsyncSession,
    product_id: int,
    data: schemas.ProductVariationCreate
) -> models.ProductVariation:
    variation = models.ProductVariation(product_id=product_id, **data.model_dump(exclude={"media"}))
    db.add(variation)
    await db.commit()
    await db.refresh(variation)
    
    # Re-fetch with relationships loaded to avoid greenlet issues
    result = await db.execute(
        select(models.ProductVariation)
        .options(selectinload(models.ProductVariation.media))
        .where(models.ProductVariation.id == variation.id)
    )
    return result.scalar_one()


async def update_variation(
    db: AsyncSession,
    variation_id: int,
    data: schemas.ProductVariationUpdate
) -> Optional[models.ProductVariation]:
    variation = await get_variation(db, variation_id)
    if not variation:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(variation, key, value)

    await db.commit()
    await db.refresh(variation)
    return variation


async def delete_variation(db: AsyncSession, variation_id: int) -> bool:
    variation = await get_variation(db, variation_id)
    if not variation:
        return False

    await db.execute(
        models.VariationMedia.__table__.delete()
        .where(models.VariationMedia.variation_id == variation_id)
    )
    await db.delete(variation)
    await db.commit()
    return True


# ==== Variation Media ====
async def get_variation_media(
    db: AsyncSession,
    media_id: int,
    variation_id: int
) -> Optional[models.VariationMedia]:
    result = await db.execute(
        select(models.VariationMedia)
        .where(
            models.VariationMedia.id == media_id,
            models.VariationMedia.variation_id == variation_id
        )
    )
    return result.scalar_one_or_none()


async def get_variation_media_by_id(
    db: AsyncSession,
    media_id: int
) -> Optional[models.VariationMedia]:
    result = await db.execute(
        select(models.VariationMedia)
        .where(models.VariationMedia.id == media_id)
    )
    return result.scalar_one_or_none()


async def create_variation_media(
    db: AsyncSession,
    media_data: schemas.VariationMediaCreate
) -> models.VariationMedia:
    media = models.VariationMedia(**media_data.model_dump())
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def update_variation_media(
    db: AsyncSession,
    media_id: int,
    update_data: schemas.VariationMediaUpdate
) -> Optional[models.VariationMedia]:
    media = await get_variation_media_by_id(db, media_id)
    if not media:
        return None

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(media, key, value)

    await db.commit()
    await db.refresh(media)
    return media


async def delete_variation_media(
    db: AsyncSession,
    media: models.VariationMedia
) -> None:
    await db.delete(media)
    await db.commit()


# ==== Customization Option ====
async def get_customization_option(
    db: AsyncSession,
    option_id: int
) -> Optional[models.CustomizationOption]:
    result = await db.execute(
        select(models.CustomizationOption)
        .options(selectinload(models.CustomizationOption.media))
        .where(models.CustomizationOption.id == option_id)
    )
    return result.scalar_one_or_none()


async def get_customization_options_by_product(
    db: AsyncSession,
    product_id: int
) -> List[models.CustomizationOption]:
    result = await db.execute(
        select(models.CustomizationOption)
        .options(selectinload(models.CustomizationOption.media))
        .where(models.CustomizationOption.product_id == product_id)
    )
    return list(result.scalars().all())


async def get_customization_options_by_user(
    db: AsyncSession,
    user_id: int,
    product_id: Optional[int] = None,
    variation_id: Optional[int] = None,
    design_area: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> List[models.CustomizationOption]:
    # ✅ FIX: Optimized eager loading to prevent MySQL sort buffer overflow
    # Removed nested Product.media loading which creates too large result sets
    query = select(models.CustomizationOption).options(
        selectinload(models.CustomizationOption.media),
        selectinload(models.CustomizationOption.product),
        selectinload(models.CustomizationOption.variation)
    ).where(models.CustomizationOption.user_id == user_id)

    if product_id:
        query = query.where(models.CustomizationOption.product_id == product_id)

    if variation_id:
        query = query.where(models.CustomizationOption.variation_id == variation_id)

    if design_area:
        query = query.where(models.CustomizationOption.design_area == design_area)

    query = query.offset(skip).limit(limit).order_by(models.CustomizationOption.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def create_customization_option(
    db: AsyncSession,
    product_id: int,
    data: schemas.CustomizationOptionCreate
) -> models.CustomizationOption:
    option = models.CustomizationOption(**data.model_dump())
    db.add(option)
    await db.commit()
    await db.refresh(option)
    
    # Re-fetch with media relationship loaded
    result = await db.execute(
        select(models.CustomizationOption)
        .options(selectinload(models.CustomizationOption.media))
        .where(models.CustomizationOption.id == option.id)
    )
    return result.scalar_one()


async def update_customization_option(
    db: AsyncSession,
    option: models.CustomizationOption,
    data: schemas.CustomizationOptionUpdate
) -> models.CustomizationOption:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(option, key, value)

    await db.commit()
    await db.refresh(option)
    return option


async def delete_customization_option(
    db: AsyncSession,
    option: models.CustomizationOption
):
    await db.delete(option)
    await db.commit()


# ==== Product Media ====
async def create_product_media(
    db: AsyncSession,
    product_id: int,
    media_data: schemas.ProductMediaCreate
) -> models.ProductMedia:
    new_media = models.ProductMedia(
        product_id=product_id,
        **media_data.model_dump()
    )
    db.add(new_media)
    await db.commit()
    await db.refresh(new_media)
    return new_media


async def get_product_media(
    db: AsyncSession,
    media_id: int
) -> Optional[models.ProductMedia]:
    result = await db.execute(
        select(models.ProductMedia)
        .where(models.ProductMedia.id == media_id)
    )
    return result.scalar_one_or_none()


async def get_all_product_media(
    db: AsyncSession,
    product_id: int
) -> List[models.ProductMedia]:
    result = await db.execute(
        select(models.ProductMedia)
        .where(models.ProductMedia.product_id == product_id)
        .order_by(models.ProductMedia.sort_order)
    )
    return list(result.scalars().all())


async def update_product_media(
    db: AsyncSession,
    media_id: int,
    media_data: schemas.ProductMediaUpdateWithID
) -> Optional[models.ProductMedia]:
    media = await get_product_media(db, media_id)
    if not media:
        return None

    for key, value in media_data.model_dump(exclude={"id"}, exclude_unset=True).items():
        setattr(media, key, value)

    await db.commit()
    await db.refresh(media)
    return media


async def delete_product_media(db: AsyncSession, media_id: int) -> bool:
    media = await get_product_media(db, media_id)
    if not media:
        return False

    await db.delete(media)
    await db.commit()
    return True
