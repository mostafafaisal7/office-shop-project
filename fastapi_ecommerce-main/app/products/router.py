from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
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
import io
import zipfile
import json
from pathlib import Path
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
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    category_ids = await crud.get_categories_for_product(db, product_id)

    # Convert product ORM to dict and add category_ids
    product_data = schemas.ProductWithReviewsResponse.model_validate(product)
    product_data.category_ids = category_ids

    # Convert media URLs for the product and all nested relationships
    product_data = convert_product_media_urls(product_data)

    # Fetch review data using the reviews client
    from app.products.reviews_client import get_product_review_summary, get_most_helpful_reviews
    
    try:
        # Get review summary
        review_summary = await get_product_review_summary(product_id)
        if review_summary and review_summary.product_id:
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
        
        # Get most helpful reviews (3-5 reviews)
        helpful_reviews = await get_most_helpful_reviews(product_id, limit=5)
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
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Warning: Failed to fetch review data for product {product_id}: {str(e)}")
        # Review data will remain None/empty

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
    design_area: Optional[schemas.AreaType] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    options = await service.get_user_customization_options(
        db, current_user.id, product_id, design_area, skip, limit
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


@router.post("/{product_id}/options", response_model=schemas.CustomizationOptionResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_customization_option(product_id: int, data: schemas.CustomizationOptionCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_customization_option(db, product_id, data)


@router.put("/options/{option_id}", response_model=schemas.CustomizationOptionResponse, dependencies=[Depends(require_admin)])
async def update_customization_option(option_id: int, data: schemas.CustomizationOptionUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_customization_option(db, option_id, data)


@router.delete("/options/{option_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
async def delete_customization_option(option_id: int, db: AsyncSession = Depends(get_db)):
    result = await service.delete_customization_option(db, option_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customization option not found")
    return {"message": "Customization option deleted"}


@router.get("/options/{option_id}/download", dependencies=[Depends(require_admin)])
async def download_customization_as_zip(option_id: int, db: AsyncSession = Depends(get_db)):
    """
    Download customization option as a ZIP file containing:
    - design.svg (SVG representation of the canvas)
    - design.json (full canvas data)
    - metadata.json (design metadata)
    - All associated media files
    """
    # Fetch the customization option
    option = await service.crud.get_customization_option(db, option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Customization option not found")

    # Create an in-memory ZIP file
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Generate SVG from canvas data
        svg_content = generate_svg_from_canvas(option.canvas_data, option.design_metadata)
        zip_file.writestr(f"design_{option_id}.svg", svg_content)

        # 2. Add full canvas data as JSON
        canvas_json = json.dumps(option.canvas_data, indent=2)
        zip_file.writestr(f"canvas_data_{option_id}.json", canvas_json)

        # 3. Add metadata
        metadata = {
            "id": option.id,
            "design_area": option.design_area,
            "product_id": option.product_id,
            "variation_id": option.variation_id,
            "canvas_width": option.design_metadata.get("canvas_width"),
            "canvas_height": option.design_metadata.get("canvas_height"),
            "created_at": str(option.created_at),
            "updated_at": str(option.updated_at),
            "design_name": option.design_metadata.get("design_name"),
        }
        zip_file.writestr(f"metadata_{option_id}.json", json.dumps(metadata, indent=2))

        # 4. Add design elements
        if option.design_elements:
            elements_json = json.dumps(option.design_elements, indent=2)
            zip_file.writestr(f"design_elements_{option_id}.json", elements_json)

        # 5. Add all media files
        if option.media:
            for idx, media in enumerate(option.media):
                try:
                    # Get the file path from the media
                    file_path = media.file_path

                    # Check if it's a full path or relative
                    if not file_path.startswith('/') and not file_path.startswith('http'):
                        # Relative path - prepend the static directory
                        full_path = os.path.join("app", file_path.lstrip('/'))
                    else:
                        # Already a full path
                        full_path = file_path

                    # Read the file and add to ZIP
                    if os.path.exists(full_path):
                        with open(full_path, 'rb') as f:
                            file_data = f.read()
                            # Use original filename
                            zip_file.writestr(f"media/{media.file_name}", file_data)
                except Exception as e:
                    print(f"Error adding media file {media.file_name}: {str(e)}")
                    continue

    # Seek to the beginning of the buffer
    zip_buffer.seek(0)

    # Return as downloadable file
    filename = f"customization_{option_id}_{option.design_area}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_svg_from_canvas(canvas_data: dict, design_metadata: dict) -> str:
    """
    Convert Fabric.js canvas data to SVG format
    """
    width = design_metadata.get("canvas_width", 800)
    height = design_metadata.get("canvas_height", 600)
    background = canvas_data.get("background", "#ffffff")
    objects = canvas_data.get("objects", [])

    # Start SVG
    svg_parts = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ',
        f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="{background}"/>'
    ]

    # Add background image if present
    bg_image = canvas_data.get("backgroundImage")
    if bg_image and isinstance(bg_image, dict):
        bg_src = bg_image.get("src", "")
        if bg_src:
            svg_parts.append(
                f'<image xlink:href="{bg_src}" width="{width}" height="{height}" preserveAspectRatio="none"/>'
            )

    # Process each object
    for obj in objects:
        obj_type = obj.get("type", "")

        if obj_type == "text" or obj_type == "i-text" or obj_type == "textbox":
            # Handle text objects
            text = obj.get("text", "")
            x = obj.get("left", 0)
            y = obj.get("top", 0)
            font_size = obj.get("fontSize", 16)
            font_family = obj.get("fontFamily", "Arial")
            fill = obj.get("fill", "#000000")
            angle = obj.get("angle", 0)
            scale_x = obj.get("scaleX", 1)
            scale_y = obj.get("scaleY", 1)

            transform = f'translate({x}, {y})'
            if angle != 0:
                transform += f' rotate({angle})'
            if scale_x != 1 or scale_y != 1:
                transform += f' scale({scale_x}, {scale_y})'

            svg_parts.append(
                f'<text x="0" y="0" font-size="{font_size}" font-family="{font_family}" '
                f'fill="{fill}" transform="{transform}">{text}</text>'
            )

        elif obj_type == "image":
            # Handle image objects
            src = obj.get("src", "")
            x = obj.get("left", 0)
            y = obj.get("top", 0)
            w = obj.get("width", 100)
            h = obj.get("height", 100)
            scale_x = obj.get("scaleX", 1)
            scale_y = obj.get("scaleY", 1)
            angle = obj.get("angle", 0)

            transform = f'translate({x}, {y})'
            if angle != 0:
                transform += f' rotate({angle})'

            svg_parts.append(
                f'<image xlink:href="{src}" x="0" y="0" width="{w * scale_x}" height="{h * scale_y}" '
                f'transform="{transform}"/>'
            )

        elif obj_type == "rect":
            # Handle rectangle objects
            x = obj.get("left", 0)
            y = obj.get("top", 0)
            w = obj.get("width", 100)
            h = obj.get("height", 100)
            fill = obj.get("fill", "#000000")
            stroke = obj.get("stroke", "")
            stroke_width = obj.get("strokeWidth", 0)

            svg_parts.append(
                f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" '
                f'stroke="{stroke}" stroke-width="{stroke_width}"/>'
            )

        elif obj_type == "circle":
            # Handle circle objects
            cx = obj.get("left", 0) + obj.get("radius", 50)
            cy = obj.get("top", 0) + obj.get("radius", 50)
            r = obj.get("radius", 50)
            fill = obj.get("fill", "#000000")
            stroke = obj.get("stroke", "")
            stroke_width = obj.get("strokeWidth", 0)

            svg_parts.append(
                f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" '
                f'stroke="{stroke}" stroke-width="{stroke_width}"/>'
            )

        elif obj_type == "path":
            # Handle path objects (like drawn shapes)
            path_data = obj.get("path", [])
            fill = obj.get("fill", "transparent")
            stroke = obj.get("stroke", "#000000")
            stroke_width = obj.get("strokeWidth", 1)

            # Convert Fabric.js path to SVG path
            if path_data:
                path_str = ""
                for segment in path_data:
                    if isinstance(segment, list):
                        path_str += " ".join(str(v) for v in segment) + " "

                svg_parts.append(
                    f'<path d="{path_str.strip()}" fill="{fill}" '
                    f'stroke="{stroke}" stroke-width="{stroke_width}"/>'
                )

    # Close SVG
    svg_parts.append('</svg>')

    return '\n'.join(svg_parts)


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
