from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.products import schemas, service, crud, models
from app.core.database import get_db
from app.common.dependencies import get_current_user, require_admin
from app.utils.media import (
    convert_media_to_url, 
    convert_product_media_urls, 
    convert_products_media_urls,
    convert_variation_media_urls,
    convert_customization_option_media_urls
)
from app.products.utils.media_utils import convert_customization_option_media
from app.products import service, schemas
from app.core.config import BASE_URL

from fastapi import UploadFile, File, Form
from uuid import uuid4
import os
# from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi import Depends, HTTPException

# Folder to store product images
UPLOAD_DIR = "app/static/products/"
PREVIEW_UPLOAD_DIR = "app/static/previews/"

router = APIRouter()



@router.post("/{product_id}/upload-image", status_code=201)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    import logging
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Upload called for product {product_id}")
    
    print(f"Upload called for product {product_id}")
    """
    Upload an image for a product. Only admins can upload.
    Saves the file in app/static/products/ and creates a ProductMedia entry.
    """

    print("Upload endpoint called for product:", product_id)
    print("Current user:", current_user)
    print("File:", file.filename)
    # Admin check
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Ensure folder exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    print("Saving file to:", file_path)

    # Read file content once
    file_content = await file.read()
    
    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Save media record in DB using existing service
    media_data = schemas.ProductMediaCreate(
        file_path=f"/images/products/{filename}",  # Store relative path, will be converted to full URL by response
        file_name=file.filename,
        file_size=len(file_content),
        media_type=schemas.MediaType.IMAGE,
        mime_type=file.content_type,
    )
    
    media = await service.create_product_media(db, product_id, media_data)
    
    # Convert to full URL for response
    return convert_media_to_url([media])[0]





@router.post(
    "/", 
    response_model=schemas.ProductResponse, 
    status_code=status.HTTP_201_CREATED, 
    dependencies=[Depends(require_admin)]
)
async def create_product(
    product_data: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = await service.create_product_with_nested(db, product_data, user_id=current_user.id)
    return convert_product_media_urls(product)


@router.get("/", response_model=schemas.ProductListResponse)
async def list_products(
    # Pagination parameters
    page: int = 1,
    per_page: int = 20,
    # Legacy pagination support (backward compatibility)
    skip: Optional[int] = None,
    limit: Optional[int] = None,
    # Search and filter parameters
    q: Optional[str] = None,  # Search query
    search: Optional[str] = None,  # Alternative search parameter
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    is_customizable: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[str] = None,  # Comma-separated tags
    # Sorting parameters
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    """
    List products with search, filtering, and pagination support.
    
    Supports both new page-based pagination and legacy skip/limit for backward compatibility.
    """
    # Handle legacy pagination parameters
    if skip is not None or limit is not None:
        # Use legacy pagination
        actual_skip = skip or 0
        actual_limit = limit or 20
        products = await service.list_products_with_categories(db, actual_skip, actual_limit)
        
        # Convert to new response format for consistency
        import math
        total_count = len(products)  # This is not accurate for legacy mode, but maintains compatibility
        total_pages = math.ceil(total_count / actual_limit) if total_count > 0 else 1
        current_page = (actual_skip // actual_limit) + 1
        
        return schemas.ProductListResponse(
            products=products,
            total=total_count,
            page=current_page,
            per_page=actual_limit,
            pages=total_pages
        )
    
    # Use new search and pagination
    search_query = q or search  # Support both 'q' and 'search' parameters
    
    # Parse tags if provided
    tags_list = None
    if tags:
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    # Validate sort parameters
    valid_sort_fields = ["name", "base_price", "created_at", "updated_at"]
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"
    
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "desc"
    
    result = await service.search_products_with_pagination(
        db=db,
        page=page,
        per_page=per_page,
        search=search_query,
        category_id=category_id,
        status=status,
        is_customizable=is_customizable,
        min_price=min_price,
        max_price=max_price,
        tags=tags_list,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Convert media URLs for all products
    result.products = convert_products_media_urls(result.products)
    return result


@router.get("/{product_id}", response_model=schemas.ProductWithReviewsResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    import time
    start_time = time.time()

    # OPTIMIZED VERSION: Fetch product with variations, media, and TEMPLATE customizations
    # Template customizations (first 10) enable multi-view and preview features
    # Full user-saved designs (200+) excluded to prevent 72MB payload
    product, category_ids, template_customizations = await crud.get_product_with_template_customizations(db, product_id)
    db_time = time.time() - start_time
    print(f"⚡ [BACKEND] Product {product_id} DB query (lightweight): {db_time*1000:.2f}ms")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # DEBUG: Check data sizes BEFORE conversion
    print(f"🔍 [DEBUG] Product {product_id} has {len(product.variations)} variations, {len(product.media)} media items, {len(template_customizations)} template customizations")

    # Convert product ORM to dict BEFORE Pydantic validation to avoid lazy load triggers
    convert_start = time.time()

    # Build variations list (WITH media for full product display)
    variations_data = []
    for v in product.variations:
        # Build media list for this variation
        variation_media_data = []
        for m in v.media:
            variation_media_data.append({
                "id": m.id,
                "variation_id": m.variation_id,
                "file_path": m.file_path,
                "file_name": m.file_name,
                "media_type": m.media_type,
                "mime_type": m.mime_type,
                "alt_text": m.alt_text,
                "design": m.design,
                "area": m.area,
                "sort_order": m.sort_order,
                "uploaded_at": m.uploaded_at
            })

        variations_data.append({
            "id": v.id,
            "product_id": v.product_id,
            "name": v.name,
            "sku": v.sku,
            "price": v.price,
            "stock_quantity": v.stock_quantity,
            "low_stock_threshold": v.low_stock_threshold,
            "attributes": v.attributes,
            "is_active": v.is_active,
            "sort_order": v.sort_order,
            "created_at": v.created_at,
            "media": variation_media_data
        })

    # Build customization options (limited to first 10 templates for multi-view)
    # Full user-saved designs can be loaded via /products/{id}/options endpoint
    customization_options_data = []
    for opt in template_customizations:
        # Build media list for this customization option
        opt_media_data = []
        for m in opt.media:
            opt_media_data.append({
                "id": m.id,
                "customization_option_id": m.customization_option_id,
                "file_path": m.file_path,
                "file_name": m.file_name,
                "file_size": m.file_size,
                "media_type": m.media_type,
                "mime_type": m.mime_type,
                "alt_text": m.alt_text,
                "canvas_object_id": m.canvas_object_id,
                "layer_order": m.layer_order,
                "uploaded_at": m.uploaded_at
            })

        customization_options_data.append({
            "id": opt.id,
            "client_reference_id": opt.client_reference_id,
            "user_id": opt.user_id,
            "product_id": opt.product_id,
            "variation_id": opt.variation_id,
            "design_area": opt.design_area,
            "canvas_data": opt.canvas_data,
            "svg_data": opt.svg_data,
            "design_metadata": opt.design_metadata,
            "design_elements": opt.design_elements,
            "created_at": opt.created_at,
            "updated_at": opt.updated_at,
            "media": opt_media_data
        })

    # Build product media list (convert ORM to dicts)
    media_data = []
    for m in product.media:
        media_data.append({
            "id": m.id,
            "product_id": m.product_id,
            "file_path": m.file_path,
            "file_name": m.file_name,
            "file_size": m.file_size,
            "media_type": m.media_type,
            "mime_type": m.mime_type,
            "alt_text": m.alt_text,
            "is_primary": m.is_primary,
            "sort_order": m.sort_order,
            "uploaded_at": m.uploaded_at
        })

    # Build product dict with all fields
    product_dict = {
        "id": product.id,
        "name": product.name,
        "short_description": product.short_description,
        "description": product.description,
        "features": product.features,
        "base_price": product.base_price,
        "category_ids": category_ids,
        "tags": product.tags,
        "sku": product.sku,
        "is_customizable": product.is_customizable,
        "weight": product.weight,
        "dimensions": product.dimensions,
        "seo_title": product.seo_title,
        "seo_description": product.seo_description,
        "status": product.status,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "variations": variations_data,
        "customization_options": customization_options_data,  # First 10 templates for multi-view
        "media": media_data,  # Product-level media (converted to dicts)
        "review_summary": None,  # Will be populated later
        "helpful_reviews": []  # Will be populated later
    }

    # Now safely create Pydantic model from dict
    product_data = schemas.ProductWithReviewsResponse(**product_dict)

    # Convert media URLs for the product and all nested relationships
    product_data = convert_product_media_urls(product_data)
    convert_time = time.time() - convert_start
    print(f"⚡ [BACKEND] Product {product_id} conversion: {convert_time*1000:.2f}ms")

    # DEBUG: Check serialized size
    import json
    import sys
    try:
        json_str = json.dumps(product_data.model_dump(), default=str)
        json_size = sys.getsizeof(json_str)
        print(f"🔍 [DEBUG] Product {product_id} JSON size: {json_size / 1024:.2f} KB ({json_size / 1024 / 1024:.2f} MB)")

        if json_size > 2 * 1024 * 1024:  # Over 2MB
            print(f"⚠️  [WARNING] Product {product_id} response is {json_size / 1024 / 1024:.2f} MB - exceeds Next.js 2MB cache limit!")

            # Sample first file_path to check if it's base64 or URL
            if product_data.media and len(product_data.media) > 0:
                sample_path = product_data.media[0].file_path[:100]
                print(f"🔍 [DEBUG] Sample media path: {sample_path}...")
    except Exception as e:
        print(f"⚠️  [DEBUG] Failed to calculate JSON size: {e}")

    # Fetch review data using the reviews client (with timeout and parallel calls)
    from app.products.reviews_client import get_product_review_summary, get_most_helpful_reviews
    import asyncio

    reviews_start = time.time()
    try:
        # OPTIMIZATION: Fetch both review calls in PARALLEL with 500ms timeout
        # This prevents slow reviews service from blocking the entire product page
        async def fetch_reviews_with_timeout():
            return await asyncio.gather(
                get_product_review_summary(product_id),
                get_most_helpful_reviews(product_id, limit=5),
                return_exceptions=True  # Don't fail if one call fails
            )

        # Set timeout to 500ms - reviews shouldn't block the page
        review_summary, helpful_reviews = await asyncio.wait_for(
            fetch_reviews_with_timeout(),
            timeout=0.5  # 500ms timeout
        )

        # Process review summary if successful
        if review_summary and not isinstance(review_summary, Exception) and review_summary.product_id:
            product_data.review_summary = schemas.ReviewSummaryResponse(
                product_id=review_summary.product_id,
                total_reviews=review_summary.total_reviews,
                average_rating=review_summary.average_rating,
                rating_1_count=review_summary.rating_1_count,
                rating_2_count=review_summary.rating_2_count,
                rating_3_count=review_summary.rating_3_count,
                rating_4_count=review_summary.rating_4_count,
                rating_5_count=review_summary.rating_5_count,
            )

        # Process helpful reviews if successful
        if helpful_reviews and not isinstance(helpful_reviews, Exception):
            product_data.helpful_reviews = [
                schemas.HelpfulReviewResponse(
                    id=review.id or 0,
                    user_id=review.user_id or 0,
                    user_name=review.user_name or "Anonymous",
                    rating=review.rating or 0,
                    title=review.title,
                    comment=review.comment,
                    helpful_count=review.helpful_count or 0,
                    created_at=review.created_at or "",
                    is_verified_purchase=review.is_verified_purchase or False,
                    media=[
                        schemas.ReviewMediaResponse(
                            id=media.get("id", 0),
                            file_path=media.get("file_path", ""),
                            file_name=media.get("file_name", ""),
                            media_type=media.get("media_type", ""),
                            alt_text=media.get("alt_text")
                        ) for media in review.media if media.get("id") and media.get("file_path")
                    ]
                ) for review in helpful_reviews if review.id and review.user_id and review.rating
            ]

        reviews_time = time.time() - reviews_start
        print(f"⚡ [BACKEND] Product {product_id} reviews fetch: {reviews_time*1000:.2f}ms (parallel with 500ms timeout)")
    except asyncio.TimeoutError:
        # Reviews took too long - skip them and don't block the page
        reviews_time = time.time() - reviews_start
        print(f"⏱️  [BACKEND] Product {product_id} reviews fetch TIMEOUT after {reviews_time*1000:.2f}ms - skipping reviews to not block page")
        # Review data will remain None/empty
    except Exception as e:
        # Log the error but don't fail the request
        reviews_time = time.time() - reviews_start
        print(f"⚠️  [BACKEND] Product {product_id} reviews fetch failed ({reviews_time*1000:.2f}ms): {str(e)}")
        # Review data will remain None/empty

    total_time = time.time() - start_time
    print(f"✅ [BACKEND] Product {product_id} TOTAL time: {total_time*1000:.2f}ms")
    return product_data


@router.put(
    "/{product_id}", 
    response_model=schemas.ProductResponse, 
    dependencies=[Depends(require_admin)]
)
async def update_product(
    product_id: int,
    product_data: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db)
):
    updated = await service.update_product_with_nested(db, product_id, product_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return convert_product_media_urls(updated)


@router.delete(
    "/{product_id}", 
    status_code=status.HTTP_200_OK, 
    dependencies=[Depends(require_admin)]
)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await service.delete_product_with_nested(db, product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# ==== Variation ====
@router.get("/variations/{variation_id}", response_model=schemas.ProductVariationResponse)
async def get_variation_by_id(variation_id: int, db: AsyncSession = Depends(get_db)):
    variation = await crud.get_variation(db, variation_id)
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")
    return convert_variation_media_urls(variation)


@router.get("/{product_id}/variations", response_model=List[schemas.ProductVariationResponse])
async def get_variations_by_product_id(product_id: int, db: AsyncSession = Depends(get_db)):
    variations = await crud.get_variations_by_product(db, product_id)
    return [convert_variation_media_urls(variation) for variation in variations]


@router.post("/{product_id}/variations", response_model=schemas.ProductVariationResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_variation(
    product_id: int,
    data: schemas.ProductVariationCreate,
    db: AsyncSession = Depends(get_db)
):
    # Create the variation first
    variation = await crud.create_variation(db, product_id, data)
    
    # Handle media creation if provided
    if data.media:
        for media_data in data.media:
            media_create_data = schemas.VariationMediaCreate(
                variation_id=int(variation.id),
                **media_data.model_dump()
            )
            await crud.create_variation_media(db, media_create_data)
        
        # Re-fetch the variation with all media loaded
        variation = await crud.get_variation(db, int(variation.id))
    
    return convert_variation_media_urls(variation)


@router.put("/variations/{variation_id}", response_model=schemas.ProductVariationResponse, dependencies=[Depends(require_admin)])
async def update_variation(
    variation_id: int,
    data: schemas.ProductVariationUpdateWithID,
    db: AsyncSession = Depends(get_db)
):
    variation = await service.update_variation_with_media(db, variation_id, data)
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")
    return convert_variation_media_urls(variation)


@router.delete("/{product_id}/variations/{variation_id}", dependencies=[Depends(require_admin)])
async def delete_variation(product_id: int, variation_id: int, db: AsyncSession = Depends(get_db)):
    success = await service.delete_product_variation(db, product_id, variation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Variation not found")
    return {"message": "Variation deleted successfully"}


# ==== Variation Media ====
@router.get("/variation/{media_id}", response_model=schemas.VariationMediaResponse)
async def get_variation_media_by_id(media_id: int, db: AsyncSession = Depends(get_db)):
    media = await crud.get_variation_media_by_id(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Variation media not found")
    return convert_media_to_url([media])[0]



# @router.get("/variation/{variation_id}/media/{media_id}", response_model=schemas.VariationMediaResponse)
# async def get_variation_media(media_id: int, variation_id: int, db: AsyncSession = Depends(get_db)):
#     media = await crud.get_variation_media(db, media_id, variation_id)
#     if not media:
#         raise HTTPException(status_code=404, detail="Variation media not found for this variation")
#     return media

@router.get("/variation/{variation_id}/media/{media_id}", response_model=schemas.VariationMediaResponse)
async def get_variation_media(media_id: int, variation_id: int, db: AsyncSession = Depends(get_db)):
    media = await crud.get_variation_media(db, media_id, variation_id)
    if not media:
        raise HTTPException(status_code=404, detail="Variation media not found for this variation")
    return convert_media_to_url([media])[0]

@router.post("/variations/medias", response_model=schemas.VariationMediaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_variation_media(data: schemas.VariationMediaCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_variation_media(db, data)


@router.put("/variations/medias/{media_id}", response_model=schemas.VariationMediaResponse, dependencies=[Depends(require_admin)])
async def update_variation_media(media_id: int, data: schemas.VariationMediaUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_variation_media(db, media_id, data)


@router.delete("/variations/medias/{media_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_variation_media(media_id: int, db: AsyncSession = Depends(get_db)):
    await service.delete_variation_media(db, media_id)
    return None


# ===== Product Media ===== #
# @router.post("/{product_id}/medias", response_model=schemas.ProductMediaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
# async def create_media(product_id: int, media_data: schemas.ProductMediaCreate, db: AsyncSession = Depends(get_db)):
#     return await service.create_product_media(db, product_id, media_data)

# @router.get("/{product_id}/medias", response_model=List[schemas.ProductMediaResponse])
# async def get_all_media(product_id: int, db: AsyncSession = Depends(get_db)):
#     media_list = await service.get_all_product_media(db, product_id)
#     return convert_media_to_url(media_list)


# @router.get("/medias/{media_id}", response_model=schemas.ProductMediaResponse)
# async def get_media(media_id: int, db: AsyncSession = Depends(get_db)):
#     media = await service.get_product_media(db, media_id)
#     if not media:
#         raise HTTPException(status_code=404, detail="Media not found")
#     return media


@router.get("/medias/{media_id}", response_model=schemas.ProductMediaResponse)
async def get_media(media_id: int, db: AsyncSession = Depends(get_db)):
    media = await service.get_product_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return convert_media_to_url([media])[0]  # single media item


@router.get("/{product_id}/medias", response_model=List[schemas.ProductMediaResponse])
async def get_all_media(product_id: int, db: AsyncSession = Depends(get_db)):
    media_list = await service.get_all_product_media(db, product_id)
    
    # Convert file_path to full URL
    for media in media_list:
        media.file_path = f"{BASE_URL}{media.file_path}"  # e.g., http://localhost:8000/images/products/...
    
    return media_list



@router.put("/medias/{media_id}", response_model=schemas.ProductMediaResponse, dependencies=[Depends(require_admin)])
async def update_media(media_id: int, media_data: schemas.ProductMediaUpdateWithID, db: AsyncSession = Depends(get_db)):
    updated = await service.update_product_media(db, media_id, media_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Media not found")
    return updated


@router.delete("/medias/{media_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_media(media_id: int, db: AsyncSession = Depends(get_db)):
    success = await service.delete_product_media(db, media_id)
    if not success:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted successfully"}


# ====== Customization Option ====== #
@router.get("/{product_id}/options", response_model=List[schemas.CustomizationOptionResponse])
async def get_customization_options(product_id: int, db: AsyncSession = Depends(get_db)):
    return await service.crud.get_customization_options_by_product(db, product_id)


@router.get("/users/me/options", response_model=List[schemas.CustomizationOptionResponse])
async def get_my_customization_options(
    product_id: Optional[int] = None,
    variation_id: Optional[int] = None,
    design_area: Optional[schemas.AreaType] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    options = await service.get_user_customization_options(
        db, current_user.id, product_id, variation_id, design_area, skip, limit
    )
    
    # Convert media paths to full URLs
    options = convert_customization_option_media(options)
    
    return options


@router.post("/users/me/options", response_model=schemas.CustomizationOptionResponse, status_code=status.HTTP_201_CREATED)
async def create_my_customization_option(
    data: schemas.CustomizationOptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a customization option for the current user"""
    # Ensure the user_id in the request matches the current user
    if data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create customization option for another user")
    
    return await service.create_customization_option(db, data.product_id, data)


# @router.put("/users/me/options/{option_id}", response_model=schemas.CustomizationOptionResponse)
# async def update_my_customization_option(
#     option_id: int,
#     data: schemas.CustomizationOptionUpdate,
#     db: AsyncSession = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     """Update a customization option for the current user"""
#     # First check if the option belongs to the current user
#     option = await service.crud.get_customization_option(db, option_id)
#     if not option:
#         raise HTTPException(status_code=404, detail="Customization option not found")
    
#     if option.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Cannot update customization option for another user")
    
#     return await service.update_customization_option(db, option_id, data)


@router.put("/users/me/options/{option_id}", response_model=schemas.CustomizationOptionResponse)
async def update_my_customization_option(
    option_id: int,
    data: schemas.CustomizationOptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a customization option for the current user"""
    # First check if the option belongs to the current user
    option = await service.crud.get_customization_option(db, option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")
    
    if option.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot update customization option for another user")
    
    updated_option = await service.update_customization_option(db, option_id, data)
    
    # Convert media file paths to full URLs
    updated_option.media = convert_media_to_url(updated_option.media)
    
    return updated_option


@router.delete("/users/me/options/{option_id}", status_code=status.HTTP_200_OK)
async def delete_my_customization_option(
    option_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a customization option for the current user"""
    return await service.delete_user_customization_option(db, option_id, current_user.id)


# @router.get("/options/{option_id}", response_model=schemas.CustomizationOptionResponse)
# async def get_customization_option(option_id: int, db: AsyncSession = Depends(get_db)):
#     option = await service.crud.get_customization_option(db, option_id)
#     if not option:
#         raise HTTPException(status_code=404, detail="Customization option not found")
#     return option


@router.get("/options/{option_id}", response_model=schemas.CustomizationOptionResponse)
async def get_customization_option(option_id: int, db: AsyncSession = Depends(get_db)):
    option = await service.crud.get_customization_option(db, option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")

    # Convert media paths to full URLs
    option = convert_customization_option_media(option)

    return option


@router.post("/options/{option_id}/snapshot", response_model=schemas.CustomizationOptionResponse, status_code=status.HTTP_201_CREATED)
async def create_customization_snapshot(
    option_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create an immutable snapshot/copy of an existing customization option.
    This is used when adding items to cart to ensure design data doesn't change.
    """
    try:
        user_id = current_user['id']
        snapshot = await service.crud.create_customization_snapshot(db, option_id, user_id)

        # Convert media paths to full URLs
        snapshot = convert_customization_option_media(snapshot)

        return snapshot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating snapshot: {e}")
        raise HTTPException(status_code=500, detail="Failed to create snapshot")


@router.post("/{product_id}/options", response_model=schemas.CustomizationOptionResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_customization_option(product_id: int, data: schemas.CustomizationOptionCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_customization_option(db, product_id, data)


@router.get("/debug/customization-options/{product_id}/{variation_id}/{user_id}")
async def debug_customization_options(
    product_id: int,
    variation_id: int,
    user_id: int,
    design_area: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Debug endpoint to see all customization options for a product/variation/user.
    Shows ID, design_area, created_at, updated_at, and text content from canvas.
    NO AUTHENTICATION REQUIRED - For debugging only!

    Example: /products/debug/customization-options/32/15/66
    """
    from sqlalchemy import select
    from app.products import models

    query = select(models.CustomizationOption).where(
        models.CustomizationOption.user_id == user_id,
        models.CustomizationOption.product_id == product_id,
        models.CustomizationOption.variation_id == variation_id
    )

    if design_area:
        query = query.where(models.CustomizationOption.design_area == design_area)

    # Order by updated_at DESC to see latest first
    query = query.order_by(models.CustomizationOption.updated_at.desc())

    result = await db.execute(query)
    options = result.scalars().all()

    debug_data = []
    for option in options:
        # Extract text from canvas objects
        text_content = []
        if option.canvas_data and isinstance(option.canvas_data, dict):
            objects = option.canvas_data.get('objects', [])
            for obj in objects:
                if obj.get('type') in ['text', 'textbox', 'i-text', 'Text']:
                    text_content.append(obj.get('text', ''))

        debug_data.append({
            "id": option.id,
            "design_area": option.design_area,
            "created_at": option.created_at.isoformat() if option.created_at else None,
            "updated_at": option.updated_at.isoformat() if option.updated_at else None,
            "text_content": text_content,
            "canvas_objects_count": len(option.canvas_data.get('objects', [])) if option.canvas_data else 0,
            "client_reference_id": option.client_reference_id
        })

    return {
        "product_id": product_id,
        "variation_id": variation_id,
        "user_id": user_id,
        "total_records": len(debug_data),
        "records": debug_data
    }



@router.put("/options/{option_id}", response_model=schemas.CustomizationOptionResponse, dependencies=[Depends(require_admin)])
async def update_customization_option(option_id: int, data: schemas.CustomizationOptionUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_customization_option(db, option_id, data)


@router.delete("/options/{option_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
async def delete_customization_option(option_id: int, db: AsyncSession = Depends(get_db)):
    result = await service.delete_customization_option(db, option_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customization option not found")
    return {"message": "Customization option deleted"}


@router.post("/{product_id}/customer-upload", status_code=201)
async def upload_customer_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Upload an image for a product as a customer (for design previews).
    Uses the same infrastructure as admin uploads but accessible to customers.
    Saves the file in app/static/products/customer/ and creates a ProductMedia entry.
    """
    import logging
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Customer upload called for product {product_id} by user {current_user.id}")
    
    print(f"Customer upload called for product {product_id}")
    print("Current user:", current_user.id)
    print("File:", file.filename)
    
    # Create customer upload directory using same pattern as admin
    customer_dir = os.path.join(UPLOAD_DIR, "customer")
    os.makedirs(customer_dir, exist_ok=True)
    
    # Generate unique filename using same approach as admin
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    filename = f"customer_{current_user.id}_{uuid4()}.{file_ext}"
    file_path = os.path.join(customer_dir, filename)
    print("Saving customer file to:", file_path)

    # Read file content once
    file_content = await file.read()
    
    # Save file to disk using same approach as admin
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Save media record in DB using same approach as admin uploads but for customer
    media_data = schemas.ProductMediaCreate(
        file_path=f"/images/products/customer/{filename}",  # Store relative path
        file_name=file.filename,
        file_size=len(file_content),
        media_type=schemas.MediaType.IMAGE,
        mime_type=file.content_type,
    )
    
    media = await service.create_product_media(db, product_id, media_data)
    
    # Convert to full URL for response using same conversion as admin
    return convert_media_to_url([media])[0]
