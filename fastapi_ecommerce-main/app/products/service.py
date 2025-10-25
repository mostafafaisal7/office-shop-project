from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.products import models, schemas, crud
from typing import List, Optional
from collections import defaultdict

async def list_products_with_categories(db: AsyncSession, skip: int = 0, limit: int = 20) -> List[schemas.ProductResponse]:
    products = await crud.get_products(db, skip, limit)
    product_ids = [p.id for p in products]

    # Get category links
    result = await db.execute(
        select(models.ProductCategory.product_id, models.ProductCategory.category_id)
        .where(models.ProductCategory.product_id.in_(product_ids))
    )
    category_links = result.all()

    category_map: dict[int, List[int]] = defaultdict(list)
    for product_id, category_id in category_links:
        category_map[product_id].append(category_id)

    response = []
    for product in products:
        # OPTIMIZATION: For listings, we don't load variations/customizations (5-10x faster)
        # Set them to empty arrays to satisfy the schema
        product.variations = []
        product.customization_options = []

        product_data = schemas.ProductResponse.model_validate(product)
        product_data.category_ids = category_map[product.id] # type: ignore
        response.append(product_data)

    return response


async def search_products_with_pagination(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    is_customizable: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[List[str]] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> schemas.ProductListResponse:
    """Search and filter products with pagination"""
    import math
    
    # Convert page-based pagination to offset-based
    skip = (page - 1) * per_page
    limit = per_page
    
    # Get products and total count
    products, total_count = await crud.get_products_with_filters(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        status=status,
        is_customizable=is_customizable,
        min_price=min_price,
        max_price=max_price,
        tags=tags,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Get category links for the returned products
    product_ids = [p.id for p in products if p.id is not None]
    if product_ids:
        result = await db.execute(
            select(models.ProductCategory.product_id, models.ProductCategory.category_id)
            .where(models.ProductCategory.product_id.in_(product_ids))
        )
        category_links = result.all()
        
        category_map: dict[int, List[int]] = defaultdict(list)
        for product_id, category_id in category_links:
            if product_id is not None and category_id is not None:
                category_map[product_id].append(category_id)
    else:
        category_map = {}
    
    # Build response products
    response_products = []
    for product in products:
        # OPTIMIZATION: For listings, we don't load variations/customizations (5-10x faster)
        # Set them to empty arrays to satisfy the schema
        product.variations = []
        product.customization_options = []

        product_data = schemas.ProductResponse.model_validate(product)
        product_data.category_ids = category_map.get(product.id, []) # type: ignore
        response_products.append(product_data)
    
    # Calculate pagination metadata
    total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1
    
    return schemas.ProductListResponse(
        products=response_products,
        total=total_count,
        page=page,
        per_page=per_page,
        pages=total_pages
    )


async def create_product_with_nested(
    db: AsyncSession, 
    product_data: schemas.ProductCreate, 
    user_id: int
) -> models.Product:
    try:
        # Create base product
        product = models.Product(
            **product_data.model_dump(
                exclude={"variations", "customization_options", "media", "category_ids"}
            ),
            user_id=user_id
        )
        db.add(product)
        await db.flush()

        # Handle variations
        for var_data in product_data.variations or []:
            variation = models.ProductVariation(
                product_id=product.id,
                **var_data.model_dump(exclude={"media"})
            )
            db.add(variation)
            await db.flush()

            # Handle variation media
            for media_data in var_data.media or []:
                media = models.VariationMedia(
                    variation_id=variation.id,
                    **media_data.model_dump()
                )
                db.add(media)

        # Handle customization options
        for opt_data in product_data.customization_options or []:
            option = models.CustomizationOption(
                product_id=product.id,
                **opt_data.model_dump()
            )
            db.add(option)

        # Handle product media
        for media_data in product_data.media or []:
            media = models.ProductMedia(
                product_id=product.id,
                **media_data.model_dump()
            )
            db.add(media)

        # Link product to categories
        if product_data.category_ids and product.id is not None:
            await crud.link_product_to_categories(db, int(product.id), product_data.category_ids)

        await db.commit()

        # Re-fetch the product with all relationships loaded
        if product.id is not None:
            created_product = await crud.get_product(db, int(product.id))
            if not created_product:
                raise HTTPException(status_code=500, detail="Product created but failed to fetch")
            return created_product
        else:
            raise HTTPException(status_code=500, detail="Product created but ID is None")

    except IntegrityError as e:
        await db.rollback()
        error_details = str(e.orig).lower()

        if "slug" in error_details:
            raise HTTPException(status_code=400, detail="Slug must be unique.")
        elif "sku" in error_details:
            raise HTTPException(status_code=400, detail="SKU must be unique.")
        else:
            print("Unexpected integrity error:", error_details)
            raise HTTPException(
                status_code=400,
                detail=f"Database constraint violation: {error_details}"
            )

    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")
    

async def update_product_with_nested(
    db: AsyncSession, 
    product_id: int, 
    product_data: schemas.ProductUpdate
) -> models.Product:
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update basic product fields
    for key, value in product_data.model_dump(
        exclude_unset=True, exclude={"variations", "customization_options", "media"}
    ).items():
        setattr(product, key, value)

    # Handle variations
    for var_data in product_data.variations or []:
        var_dict = var_data.model_dump(exclude_unset=True, exclude={"media"})
        variation = None
        if var_data.id:
            variation = await crud.get_variation(db, var_data.id)
            if variation:
                for k, v in var_dict.items():
                    setattr(variation, k, v)
        else:
            variation = models.ProductVariation(product_id=product.id, **var_dict)
            db.add(variation)
            await db.flush()

        # Handle media only if variation exists
        if variation:
            for media_data in var_data.media or []:
                media_dict = media_data.model_dump(exclude_unset=True)
                if media_data.id:
                    media = await crud.get_variation_media(db, media_data.id, int(variation.id))
                    if media:
                        for k, v in media_dict.items():
                            if k != 'id':  # Skip the id field when updating
                                setattr(media, k, v)
                else:
                    new_media = models.VariationMedia(variation_id=int(variation.id), **{k: v for k, v in media_dict.items() if k != 'id'})
                    db.add(new_media)

    # Handle customization options
    for opt_data in product_data.customization_options or []:
        opt_dict = opt_data.model_dump(exclude_unset=True)
        if opt_data.id:
            option = await crud.get_customization_option(db, opt_data.id)
            if option:
                for k, v in opt_dict.items():
                    setattr(option, k, v)
        else:
            new_opt = models.CustomizationOption(product_id=product.id, **opt_dict)
            db.add(new_opt)

    # Handle product media
    for media_data in product_data.media or []:
        media_dict = media_data.model_dump(exclude_unset=True)
        if media_data.id:
            media = await crud.get_product_media(db, media_data.id)
            if media:
                for k, v in media_dict.items():
                    if k != 'id':  # Skip the id field when updating
                        setattr(media, k, v)
        else:
            new_media = models.ProductMedia(product_id=product.id, **{k: v for k, v in media_dict.items() if k != 'id'})
            db.add(new_media)

    # Link product to categories
    if product_data.category_ids:
        await crud.link_product_to_categories(db, int(product.id), product_data.category_ids)

    await db.commit()

    # Re-fetch the product to ensure all relationships are up-to-date
    updated_product = await crud.get_product(db, int(product.id))
    return updated_product



async def delete_product_with_nested(db: AsyncSession, product_id: int) -> dict:
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        await crud.delete_product(db, product)
        return {"message": "Product deleted successfully"}
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete product")

### variation ###
async def update_variation_with_media(
    db: AsyncSession,
    variation_id: int,
    data: schemas.ProductVariationUpdateWithID
) -> Optional[models.ProductVariation]:
    # Update variation fields
    variation_update_data = schemas.ProductVariationUpdate(
        **data.model_dump(exclude={"id", "media"}, exclude_unset=True)
    )
    updated_variation = await crud.update_variation(db, variation_id, variation_update_data)

    if not updated_variation:
        return None

    # Handle media - update existing or create new
    for media_item in data.media or []:
        if media_item.id:
            # Update existing media
            media_update_data = schemas.VariationMediaUpdate(
                **media_item.model_dump(exclude_unset=True)
            )
            await crud.update_variation_media(db, media_item.id, media_update_data)
        else:
            # Create new media
            media_create_data = schemas.VariationMediaCreate(
                variation_id=variation_id,
                **media_item.model_dump(exclude={"id"})
            )
            await crud.create_variation_media(db, media_create_data)

    return updated_variation

async def delete_product_variation(db: AsyncSession, product_id: int, variation_id: int) -> dict:
    variation = await crud.get_variation(db, variation_id)
    if not variation or variation.product_id != product_id: # type: ignore
        raise HTTPException(status_code=404, detail="Variation not found")

    if await crud.delete_variation(db, variation_id):
        return {"message": "Product variation deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete variation")

# variation media        
async def create_variation_media(db: AsyncSession, data: schemas.VariationMediaCreate) -> models.VariationMedia:
    variation = await crud.get_variation(db, data.variation_id)
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")

    return await crud.create_variation_media(db, data)

async def update_variation_media(db: AsyncSession, media_id: int, data: schemas.VariationMediaUpdate) -> models.VariationMedia:
    media = await crud.get_variation_media_by_id(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Variation media not found")

    return await crud.update_variation_media(db, media_id, data)

async def delete_variation_media(db: AsyncSession, media_id: int) -> dict:
    media = await crud.get_variation_media_by_id(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Variation media not found")

    await crud.delete_variation_media(db, media)
    return {"message": "Variation media deleted successfully"}
    
### Product Media ###
async def create_product_media(db: AsyncSession, product_id: int, media_data: schemas.ProductMediaCreate) -> models.ProductMedia:
    return await crud.create_product_media(db, product_id, media_data)

async def get_product_media(db: AsyncSession, media_id: int) -> Optional[models.ProductMedia]:
    return await crud.get_product_media(db, media_id)

async def get_all_product_media(db: AsyncSession, product_id: int) -> List[models.ProductMedia]:
    return await crud.get_all_product_media(db, product_id)

async def update_product_media(db: AsyncSession, media_id: int, media_data: schemas.ProductMediaUpdateWithID) -> Optional[models.ProductMedia]:
    return await crud.update_product_media(db, media_id, media_data)

async def delete_product_media(db: AsyncSession, media_id: int) -> bool:
    return await crud.delete_product_media(db, media_id)

#### Customization Option ####
async def create_customization_option(db: AsyncSession, product_id: int, data: schemas.CustomizationOptionCreate) -> models.CustomizationOption:
    return await crud.create_customization_option(db, product_id, data)

async def update_customization_option(db: AsyncSession, option_id: int, data: schemas.CustomizationOptionUpdate) -> models.CustomizationOption:
    option = await crud.get_customization_option(db, option_id)
    
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")
    return await crud.update_customization_option(db, option, data)

async def delete_customization_option(db: AsyncSession, option_id: int) -> dict:
    option = await crud.get_customization_option(db, option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")
    await crud.delete_customization_option(db, option)
    return {"message": "Customization option deleted successfully"}

async def delete_user_customization_option(db: AsyncSession, option_id: int, user_id: int) -> dict:
    """Delete a customization option, but only if it belongs to the user"""
    option = await crud.get_customization_option(db, option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")

    # Verify the option belongs to the current user
    if option.user_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this design")

    await crud.delete_customization_option(db, option)
    return {"message": "Customization option deleted successfully"}

async def get_user_customization_options(
    db: AsyncSession,
    user_id: int,
    product_id: Optional[int] = None,
    variation_id: Optional[int] = None,
    design_area: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> List[models.CustomizationOption]:
    return await crud.get_customization_options_by_user(
        db, user_id, product_id, variation_id, design_area, skip, limit
    )
